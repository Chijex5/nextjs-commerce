import type {
  AnchorHTMLAttributes,
  ElementType,
  HTMLAttributes,
  ImgHTMLAttributes,
  ReactNode,
} from "react";

function wrapTag<
  TagProps extends
    | HTMLAttributes<HTMLElement>
    | AnchorHTMLAttributes<HTMLAnchorElement>,
>(Tag: ElementType, extraClassName?: string) {
  return function WrappedComponent({
    children,
    style,
    ...props
  }: TagProps & { children?: ReactNode }) {
    const className = [
      extraClassName,
      (props as { className?: string }).className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Tag
        {...props}
        className={className || undefined}
        style={style}
      >
        {children}
      </Tag>
    );
  };
}

export const Container = wrapTag<HTMLAttributes<HTMLDivElement>>("div");
export const Section = wrapTag<HTMLAttributes<HTMLDivElement>>("div");
export const Row = wrapTag<HTMLAttributes<HTMLDivElement>>("div");
export const Column = wrapTag<HTMLAttributes<HTMLDivElement>>("div");
export const Text = wrapTag<HTMLAttributes<HTMLParagraphElement>>("p");
export const Hr = wrapTag<HTMLAttributes<HTMLHRElement>>("hr");
export const Link = wrapTag<AnchorHTMLAttributes<HTMLAnchorElement>>("a");
export const Button = wrapTag<AnchorHTMLAttributes<HTMLAnchorElement>>("a");

export function Img({
  style,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} style={style} />;
}