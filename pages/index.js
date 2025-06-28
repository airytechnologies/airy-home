import Head from 'next/head';

export default function Home() {
  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <div className="bg-[#d8a0a6] h-screen text-black flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold tracking-widest">airy</h1>
      <p className="mt-2 text-sm uppercase">this was always going to happen</p>

      <p className="mt-6 text-xs uppercase tracking-wide">trust-ready. AI-native. blockchain, rebuilt.</p>

      <nav className="absolute top-4 right-4 space-x-4 text-xs">
        <a href="#" className="hover:underline">About</a>
        <a href="#" className="hover:underline">Docs</a>
        <a href="#" className="hover:underline">Contact</a>
      </nav>
    </div>
=======
=======
>>>>>>> 441ce8c (Add meta tags and favicon support)
    <>
      <Head>
        <title>airy — Blockchain, Rebuilt</title>
        <meta name="description" content="Trust-ready. AI-native. Blockchain, rebuilt from the first block." />
        <meta property="og:title" content="airy" />
        <meta property="og:description" content="Blockchain, rebuilt from the first block." />
        <meta property="og:image" content="/og.png" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-[#d8a0a6] h-screen text-black flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold tracking-widest">airy</h1>
        <p className="mt-2 text-sm uppercase">this was always going to happen</p>
        <p className="mt-6 text-xs uppercase tracking-wide">trust-ready. AI-native. blockchain, rebuilt.</p>
        <nav className="absolute top-4 right-4 space-x-4 text-xs">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Docs</a>
          <a href="#" className="hover:underline">Contact</a>
        </nav>
      </div>
    </>
<<<<<<< HEAD
>>>>>>> 441ce8c (Add meta tags and favicon support)
=======
>>>>>>> 441ce8c (Add meta tags and favicon support)
  )
}
