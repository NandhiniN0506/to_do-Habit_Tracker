export default function AuthHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 px-4 py-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-bold">T</span>
        <div className="text-left">
          <div className="text-xl font-semibold leading-tight">TaskFlow</div>
          <div className="text-xs text-muted-foreground">✨ Stay organized, one habit at a time</div>
        </div>
      </div>
    </div>
  );
}
