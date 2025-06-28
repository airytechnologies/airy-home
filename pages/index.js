export default function Home() {
  return (
    <div className="bg-[#d8a0a6] h-screen text-black flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold tracking-widest">airy</h1>
      <p className="mt-2 text-sm uppercase">this was always going to happen</p>

      <div className="mt-8 space-y-1 text-sm text-center">
        <p>🞂 from first block</p>
        <p>🞂 to blockdawg</p>
        <p>🞂 to the house that builds itself</p>
      </div>

      <p className="mt-6 text-xs uppercase tracking-wide">trust-ready. AI-native. blockchain, rebuilt.</p>

      <nav className="absolute top-4 right-4 space-x-4 text-xs">
        <a href="#" className="hover:underline">About</a>
        <a href="#" className="hover:underline">Docs</a>
        <a href="#" className="hover:underline">Contact</a>
      </nav>
    </div>
  )
}