import React from "react";
import QuestionDetailCard, {
  QuestionDetailCardProps,
  SpecialTag as NewSpecialTag,
} from "./QuestionDetailCard";

export interface QuestionCardProps extends QuestionDetailCardProps {}

const QuestionCard: React.FC<QuestionCardProps> = (props) => {
  return <QuestionDetailCard {...props} />;
};

export default QuestionCard;
