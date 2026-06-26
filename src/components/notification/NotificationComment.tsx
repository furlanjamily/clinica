interface NotificationCommentProps {
  comment: string;
}

export function NotificationComment({ comment }: NotificationCommentProps) {
  return (
    <div className="mt-3 rounded-[14px] bg-primary/[0.06] px-4 py-4">
      <p className="text-sm italic leading-relaxed text-secondary">
        {comment}
      </p>
    </div>
  );
}
