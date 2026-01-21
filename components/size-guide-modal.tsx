"use client";

import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface SizeGuideProps {
  productType?: string;
}

interface SizeChart {
  size: string;
  us?: string;
  uk?: string;
  eu?: string;
  cm?: string;
  [key: string]: string | undefined;
}

export function SizeGuideButton({ productType = "footwear" }: SizeGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Default size chart for footwear
  const defaultSizeChart: SizeChart[] = [
    { size: "36", us: "5", uk: "3", eu: "36", cm: "23" },
    { size: "37", us: "6", uk: "4", eu: "37", cm: "23.5" },
    { size: "38", us: "7", uk: "5", eu: "38", cm: "24" },
    { size: "39", us: "8", uk: "6", eu: "39", cm: "24.5" },
    { size: "40", us: "9", uk: "7", eu: "40", cm: "25" },
    { size: "41", us: "10", uk: "8", eu: "41", cm: "25.5" },
    { size: "42", us: "11", uk: "9", eu: "42", cm: "26" },
    { size: "43", us: "12", uk: "10", eu: "43", cm: "26.5" },
    { size: "44", us: "13", uk: "11", eu: "44", cm: "27" },
    { size: "45", us: "14", uk: "12", eu: "45", cm: "27.5" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-neutral-600 underline underline-offset-4 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
      >
        Size Guide
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Full-screen container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-black dark:text-white">
                Size Guide
              </Dialog.Title>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close size guide"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-6 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
              <h3 className="mb-2 font-semibold text-black dark:text-white">
                How to Measure Your Feet
              </h3>
              <ol className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                <li>1. Stand on a flat surface with your heel against a wall</li>
                <li>2. Mark the longest part of your foot on a piece of paper</li>
                <li>3. Measure the distance from the wall to the mark</li>
                <li>4. Compare your measurement to the chart below</li>
              </ol>
            </div>

            {/* Size Chart Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="pb-3 pr-4 font-semibold text-black dark:text-white">Size</th>
                    <th className="pb-3 pr-4 font-semibold text-black dark:text-white">US</th>
                    <th className="pb-3 pr-4 font-semibold text-black dark:text-white">UK</th>
                    <th className="pb-3 pr-4 font-semibold text-black dark:text-white">EU</th>
                    <th className="pb-3 font-semibold text-black dark:text-white">CM</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultSizeChart.map((row) => (
                    <tr
                      key={row.size}
                      className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                    >
                      <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{row.size}</td>
                      <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">{row.us}</td>
                      <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">{row.uk}</td>
                      <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">{row.eu}</td>
                      <td className="py-3 text-neutral-700 dark:text-neutral-300">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tips */}
            <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
              <h4 className="mb-2 font-semibold text-black dark:text-white">Sizing Tips</h4>
              <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                <li>• If you&apos;re between sizes, we recommend sizing up</li>
                <li>• Measure your feet at the end of the day when they&apos;re slightly larger</li>
                <li>• Handmade footwear may fit slightly differently than mass-produced shoes</li>
              </ul>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
