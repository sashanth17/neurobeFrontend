import React, { useState, useEffect } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { capitalizeFLetter } from "@/utils/function.utils";

interface TreeNode { id: number; name: string; slug?: string; description?: string; title?: string; category_id?: number; children?: TreeNode[]; }

function transformNode(node: any): TreeNode {
  const children = Array.isArray(node?.children)
    ? node.children.filter(Boolean).map(transformNode)
    : [];

  return {
    id: node?.id,
    name: node?.name || "Untitled category",
    slug: node?.slug,
    description: node?.description,
    title: node?.title,
    category_id: node?.category_id,
    children: children.length ? children : undefined,
  };
}

export function transformCategoryData(apiData: any[]): TreeNode[] {
  return (Array.isArray(apiData) ? apiData : []).filter(Boolean).map((cat) => ({
    id: cat.id,
    name: cat.name || "Untitled category",
    slug: cat.slug,
    description: cat.description,
    title: cat.title,
    children: Array.isArray(cat.subcategories)
      ? cat.subcategories.filter((s: any) => s && !s.parent_id).map(transformNode)
      : undefined,
  }));
}

function getAllDescendantsWithDepth(node: TreeNode, depth: number): { node: TreeNode; depth: number }[] {
  if (!node.children?.length) return [{ node, depth }];
  return [{ node, depth }, ...node.children.flatMap((c) => getAllDescendantsWithDepth(c, depth + 1))];
}

function ChildNode({
  node, depth, ancestors, selectedIds, onToggle, onEdit, onDelete, openIds,
}: {
  node: TreeNode;
  depth: number;
  ancestors: TreeNode[];
  selectedIds: Set<number>;
  onToggle: (nodes: { node: TreeNode; depth: number }[], select: boolean) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  openIds?: Set<number>;
}) {
  const [open, setOpen] = useState(() => openIds?.has(node.id) ?? false);
  const hasChildren = !!node.children?.length;
  const allDesc = getAllDescendantsWithDepth(node, depth);
  const isChecked = allDesc.every((n) => selectedIds.has(n.node.id));
  const isIndeterminate = !isChecked && allDesc.some((n) => selectedIds.has(n.node.id));
  const paddingLeft = `${(depth + 1) * 12 + 8}px`;

  return (
    <div>
      <div
        className="flex w-full items-center justify-between hover:bg-blue-50"
        style={{ paddingLeft, paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px" }}
      >
        <label className="flex flex-1 items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isChecked}
            ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
            onChange={() => onToggle(allDesc, isIndeterminate ? false : !isChecked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span
            className={`text-sm ${hasChildren ? "font-semibold text-[#000]" : "text-[#000]"}`}
            onClick={(e) => { if (hasChildren) { e.preventDefault(); setOpen((p) => !p); } }}
          >
            {capitalizeFLetter(node.name)}
          </span>
        </label>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <span
              onClick={(e) => { e.stopPropagation(); onEdit({ id: node.id, name: node.name, slug: node.slug, description: node.description, title: node.title, category_id: node.category_id, depth, ancestors }); }}
              className="cursor-pointer p-1 text-[#000] hover:text-blue-500"
            >
              <Pencil className="h-3.5 w-3.5" />
            </span>
          )}
          {onDelete && (
            <span
              onClick={(e) => { e.stopPropagation(); onDelete({ id: node.id, name: node.name, depth, ancestors }); }}
              className="cursor-pointer p-1 text-[#000] hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </span>
          )}
          {hasChildren && (
            <ChevronDown
              onClick={() => setOpen((p) => !p)}
              className={`h-3 w-3 cursor-pointer text-[#000] transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>
      {open && hasChildren && (
        <div className="border-t border-gray-100">
          {node.children!.map((child) => (
            <ChildNode
              key={child.id}
              node={child}
              depth={depth + 1}
              ancestors={[...ancestors, node]}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              openIds={openIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategorySelector({
  categoryData = [],
  onChange,
  value,
  onEdit,
  onDelete,
}: {
  categoryData: any[];
  onChange?: (payload: any, rawSelected: any[]) => void;
  value?: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}) {
  const makeKey = (parentId: number, nodeId: number) => `${parentId}|${nodeId}`;
  const matchesParent = (key: string, parentId: number) => key.split("|")[0] === String(parentId);

  const buildScopedMap = (vals: any[], data: any[]): Map<string, number> => {
    const map = new Map<string, number>();
    if (!vals?.length || !data?.length) return map;

    // If vals include parentId, use it directly to avoid cross-parent collision
    const hasScopedVals = vals.some((x) => x.parentId != null);

    if (hasScopedVals) {
      vals.forEach(({ id, depth, parentId }) => {
        if (parentId != null) {
          map.set(makeKey(parentId, id), depth);
        }
      });
      return map;
    }

    // Legacy values do not carry a parentId. Scope child selections to the
    // explicitly selected main categories so an ID from another tree cannot
    // activate a different main category during edit-form prefill.
    const selectedParentIds = new Set(
      vals.filter((item) => item.depth === 0).map((item) => item.id)
    );

    data
      .filter((parent) => selectedParentIds.has(parent.id))
      .forEach((parent) => {
        const nodeInfoMap = new Map<number, number>();
        getAllDescendantsWithDepth(parent, 0).forEach(({ node, depth }) => {
          nodeInfoMap.set(node.id, depth);
        });

        vals.forEach(({ id }) => {
          const depth = nodeInfoMap.get(id);
          if (depth != null) {
            map.set(makeKey(parent.id, id), depth);
          }
        });
      });

    return map;
  };

  const [selectedMap, setSelectedMap] = useState<Map<string, number>>(
    () => buildScopedMap(value || [], categoryData)
  );
  const [openParentIds, setOpenParentIds] = useState<number[]>([]);

  const initializedRef = React.useRef(false);
  useEffect(() => {
    const len = value?.length ?? 0;
    if (len > 0 && categoryData.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      const scopedMap = buildScopedMap(value!, categoryData);
      setSelectedMap(scopedMap);
      // Open only explicitly selected main-category accordions. Nested IDs can
      // overlap with a main-category ID, so they must not control root accordions.
      const selectedMainCategoryIds = categoryData
        .filter((parent) =>
          Array.from(scopedMap.keys()).some((key) => matchesParent(key, parent.id))
        )
        .map((parent) => parent.id);
      setOpenParentIds(selectedMainCategoryIds);
    }
  }, [value, categoryData]);

  const buildFullPayload = (map: Map<string, number>, data: any[]) => {
    const parent_ids = new Set<number>();
    const child_ids = new Set<number>();
    const sub_child_ids = new Set<number>();

    function walk(node: any, depth: number, parentId: number) {
      const allDesc = getAllDescendantsWithDepth(node, depth);
      const anySelected = allDesc.some((n) => map.has(makeKey(parentId, n.node.id)));
      if (!anySelected) return;
      if (depth === 0) parent_ids.add(node.id);
      else if (depth === 1) child_ids.add(node.id);
      else sub_child_ids.add(node.id);
      node.children?.forEach((c: any) => walk(c, depth + 1, parentId));
    }

    data.forEach((parent) => walk(parent, 0, parent.id));
    return {
      parent_ids: Array.from(parent_ids),
      child_ids: Array.from(child_ids),
      sub_child_ids: Array.from(sub_child_ids),
    };
  };

  const toggleNodes = (nodes: { node: TreeNode; depth: number }[], select: boolean, parentId: number) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      nodes.forEach(({ node, depth }) =>
        select ? next.set(makeKey(parentId, node.id), depth) : next.delete(makeKey(parentId, node.id))
      );
      const payload = buildFullPayload(next, categoryData);
      onChange?.(payload, Array.from(next.entries()).map(([key, depth]) => ({ 
        id: Number(key.split("|")[1]), 
        parentId: Number(key.split("|")[0]),
        depth 
      })));
      return next;
    });
  };

  const toggleParent = (id: number) =>
    setOpenParentIds((prev) => (prev.includes(id) ? [] : [id]));

  return (
    <div className="w-full min-w-0">
      <div className="space-y-2">
        {categoryData.map((parent) => {
          const isParentOpen = openParentIds.includes(parent.id);
          const allDesc = getAllDescendantsWithDepth(parent, 0);
          const isChecked = allDesc.every((n) => selectedMap.has(makeKey(parent.id, n.node.id)));
          const isIndeterminate = !isChecked && allDesc.some((n) => selectedMap.has(makeKey(parent.id, n.node.id)));
          const selectedCount = allDesc.filter((n) => selectedMap.has(makeKey(parent.id, n.node.id))).length;
          const scopedSelectedIds = new Set(
            Array.from(selectedMap.keys())
              .filter((k) => matchesParent(k, parent.id))
              .map((k) => Number(k.split("|")[1]))
          );

          return (
            <div key={parent.id} className="rounded-lg border-2 border-gray-100 bg-white">
              <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50">
                <label className="flex flex-1 items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                    onChange={() => toggleNodes(allDesc, isIndeterminate ? false : !isChecked, parent.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span
                    className="text-sm font-bold uppercase tracking-wide text-[#000]"
                    onClick={(e) => { e.preventDefault(); toggleParent(parent.id); }}
                  >
                    {capitalizeFLetter(parent.name)}
                  </span>
                  {parent.children?.length > 0 && (
                    <span className="text-xs text-[#000] font-normal">{parent.children.length} categories</span>
                  )}
                  {selectedCount > 0 && (
                    <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">
                      {selectedCount} selected
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-1 shrink-0">
                  {onEdit && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onEdit({ id: parent.id, name: parent.name, slug: parent.slug, description: parent.description, title: parent.title, depth: 0 }); }}
                      className="cursor-pointer p-1 text-[#000] hover:text-blue-500"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {onDelete && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onDelete({ id: parent.id, name: parent.name, depth: 0 }); }}
                      className="cursor-pointer p-1 text-[#000] hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <ChevronDown
                    onClick={() => toggleParent(parent.id)}
                    className={`h-4 w-4 cursor-pointer text-[#000] transition-transform ${isParentOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {isParentOpen && parent.children?.length > 0 && (
                <div className="border-t border-gray-200">
                  {parent.children.map((child: TreeNode) => (
                    <ChildNode
                      key={child.id}
                      node={child}
                      depth={1}
                      ancestors={[parent]}
                      selectedIds={scopedSelectedIds}
                      onToggle={(nodes, select) => toggleNodes(nodes, select, parent.id)}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      openIds={new Set(openParentIds)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
