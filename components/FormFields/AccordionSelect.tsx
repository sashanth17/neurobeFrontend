import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { capitalizeFLetter } from "@/utils/function.utils";

interface TreeNode { id: number; name: string; category_id?: number; children?: TreeNode[]; }

interface Props {
  title?: string;
  placeholder?: string;
  apiData: any[];
  value?: any;
  onChange: (selected: any) => void;
  onEdit?: (item: { id: number; name: string; type: string; parent_id?: number; child_id?: number }) => void;
  required?: boolean;
  error?: string;
  excludeId?: number;
}

function transformNode(node: any): TreeNode {
  const children = Array.isArray(node?.children)
    ? node.children.filter(Boolean).map(transformNode)
    : [];

  return {
    id: node?.id,
    name: node?.name || "Untitled category",
    category_id: node?.category_id,
    children: children.length ? children : undefined,
  };
}

function transform(apiData: any[]): TreeNode[] {
  return (Array.isArray(apiData) ? apiData : []).filter(Boolean).map((cat) => ({
    id: cat.id,
    name: cat.name || "Untitled category",
    children: Array.isArray(cat.subcategories)
      ? cat.subcategories.filter(Boolean).map(transformNode)
      : undefined,
  }));
}

function hasSelectedDescendant(node: TreeNode, selectedId?: number): boolean {
  if (!selectedId) return false;
  if (node.id === selectedId) return true;
  return node.children?.some((c) => hasSelectedDescendant(c, selectedId)) ?? false;
}

function TreeNodeRow({
  node,
  depth,
  breadcrumb,
  value,
  onSelect,
  onEdit,
}: {
  node: TreeNode;
  depth: number;
  breadcrumb: string;
  value: any;
  onSelect: (item: any) => void;
  onEdit?: (item: any) => void;
}) {
  const [expanded, setExpanded] = useState(() => hasSelectedDescendant(node, value?.id) && node.id !== value?.id);
  const label = breadcrumb ? `${breadcrumb} > ${node.name}` : node.name;
  const isSelected = value?.id === node.id;
  const paddingLeft = `${(depth + 1) * 12}px`;
  const bgClass = depth === 0 ? "" : depth === 1 ? "bg-gray-50" : depth === 2 ? "bg-gray-100" : "bg-gray-150";

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2 pr-3 hover:bg-blue-50 ${bgClass}`}
        style={{ paddingLeft }}
      >
        <div className="flex flex-1 cursor-pointer items-center gap-2" onClick={() => node.children?.length && setExpanded((p) => !p)}>
          <input
            type="radio"
            checked={isSelected}
            onChange={() => onSelect({ id: node.id, label, type: `level${depth}`, depth, category_id: node.category_id })}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 text-blue-600"
          />
          <span className={`text-sm ${depth === 0 ? "font-semibold text-[#000]" : "text-[#000]"}`}>
            {capitalizeFLetter(node.name)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit({ id: node.id, name: node.name, type: `level${depth}` }); }} className="p-1 text-[#000] hover:text-blue-500">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {node.children?.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }} className="text-[#000] hover:text-[#000]">
              <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>
      </div>
      {expanded && node.children?.map((child) => (
        <TreeNodeRow key={child.id} node={child} depth={depth + 1} breadcrumb={label} value={value} onSelect={onSelect} onEdit={onEdit} />
      ))}
    </div>
  );
}

function filterNode(node: TreeNode, excludeId: number): TreeNode | null {
  if (node.id === excludeId) return null;
  return {
    ...node,
    children: node.children?.map((c) => filterNode(c, excludeId)).filter(Boolean) as TreeNode[],
  };
}

export default function AccordionSelect({ title, placeholder = "Select", apiData = [], value, onChange, onEdit, required, error, excludeId }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  let data = transform(apiData);
  if (excludeId) {
    data = data.map((n) => filterNode(n, excludeId)).filter(Boolean) as TreeNode[];
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (item: any) => { onChange(item); setOpen(false); };

  return (
    <div className="relative w-full" ref={ref}>
      {title && (
        <label className="mb-1 block text-sm font-medium text-[#000]">
          {title}{required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm hover:border-blue-400"
      >
        <span className={value ? "text-[#000]" : "text-[#000]"}>
          {value ? capitalizeFLetter(value.label) : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#000] transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {data.map((node) => (
            <TreeNodeRow key={node.id} node={node} depth={0} breadcrumb="" value={value} onSelect={select} onEdit={onEdit ? (item) => { onEdit(item); setOpen(false); } : undefined} />
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
