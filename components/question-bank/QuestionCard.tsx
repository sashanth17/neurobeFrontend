import React from "react";
import QuestionDetailCard, {
  QuestionDetailCardProps,
  SpecialTag as NewSpecialTag,
} from "./QuestionDetailCard";

interface Tag {
  label: string;
}

interface SpecialTag {
  label: string;
  color?: "green" | "orange" | "gray";
}

export interface QuestionCardProps {
  id: string;
  question: string;
  unit: string;
  topic: string;
  subtopic?: string;
  tags: (Tag | string)[];
  specialTag?: SpecialTag;
  status: "approved" | "reviewed" | "pending" | "draft";
  onView?: () => void;
  onEdit?: () => void;
  onApprove?: () => void;
  onMarkAsReviewed?: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = (props) => {
  return <QuestionDetailCard {...props} />;
};

export default QuestionCard;
