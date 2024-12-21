export const LogoWithText: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <img
        height={48}
        width={48}
        src="/review_corral_logo-min.png"
        alt="Review Corral logo"
      />
      <span className="text-2xl font-bold text-gray-900">Review Corral</span>
    </div>
  );
};
