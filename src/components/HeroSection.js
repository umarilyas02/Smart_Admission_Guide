"use client";

import Image from "next/image";

export default function HeroSection({ title, subtitle, primaryCta, secondaryCta, imageSrc }) {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        <div className="fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>

          <p className="mt-5 text-gray-600 text-lg">{subtitle}</p>

          <div className="mt-6 flex space-x-4">
            {primaryCta && (
              <a
                href={primaryCta.href}
                className="bg-primary text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
              >
                {primaryCta.label}
              </a>
            )}

            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition"
              >
                {secondaryCta.label}
              </a>
            )}
          </div>
        </div>

        {imageSrc && (
          <div className="hidden md:block relative w-full h-96">
            <Image 
              src={imageSrc} 
              alt="Hero" 
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </section>
  );
}
