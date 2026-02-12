export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold">GitHub Global</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          自动化翻译您的 GitHub 仓库文档
        </p>
        <div className="mt-8">
          <a
            href="/login"
            className="inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            开始使用
          </a>
        </div>
      </div>
    </div>
  );
}
