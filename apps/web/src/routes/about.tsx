import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-12 pb-[20vh]">
      <h1 className="text-4xl font-semibold">About Backboard</h1>

      <div className="max-w-xl text-justify flex items-center justify-center flex-col gap-4 text-muted-foreground">
        <p className="text-lg">
          Backboard in an offline-first data visualization dashboard for
          exploring, analyzing and comparing NBA shot data.
        </p>

        <p className="text-lg">
          It is entirely open-source, so feel free to check out the{' '}
          <a
            href="https://github.com/RicardoDalcin/backboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-500 transition-colors"
          >
            source code
          </a>{' '}
          and contribute to the project. The stack used is React, Tailwind and
          to make offline fast queries possible the WASM port of SQLite was used
          with the Origin-Private File System API.
        </p>
      </div>
    </div>
  );
}
