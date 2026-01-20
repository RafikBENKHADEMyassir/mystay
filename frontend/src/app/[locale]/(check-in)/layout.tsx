type CheckInLayoutProps = {
  children: React.ReactNode;
};

export default function CheckInLayout({ children }: CheckInLayoutProps) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

