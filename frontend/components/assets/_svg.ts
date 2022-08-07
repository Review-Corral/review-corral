export interface SVGProps {
  className?: string;
  onClick?: () => void;
  // Pass all props to underlying <svg> tag
  [prop: string]: any;
}
