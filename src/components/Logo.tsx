type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-24",
    md: "w-40",
    lg: "w-64",
  };

  return (
    <div className={`mx-auto ${sizeClasses[size]} ${className}`}>
      <img
        src="/images/logo.png"
        alt="Journey With Hope"
        className="w-full h-auto"
      />
    </div>
  );
}
