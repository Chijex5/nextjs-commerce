"use client";

import { useState, useEffect } from "react";
import { StarRating } from "./reviews/star-rating";

interface Testimonial {
  id: string;
  customerName: string;
  role: string | null;
  content: string;
  rating: number;
  image: string | null;
}

export function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const response = await fetch("/api/testimonials");
        if (response.ok) {
          const data = await response.json();
          setTestimonials(data.testimonials);
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, []);

  // Auto-rotate testimonials every 6 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-600">Loading testimonials...</p>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white p-8 md:p-12 dark:border-neutral-800 dark:bg-black">
      <div className="mx-auto max-w-3xl text-center">
        {/* Stars */}
        <div className="mb-6 flex justify-center">
          <StarRating rating={currentTestimonial.rating} size="lg" />
        </div>

        {/* Quote */}
        <blockquote className="mb-6 text-lg leading-relaxed text-neutral-700 md:text-xl dark:text-neutral-300">
          &ldquo;{currentTestimonial.content}&rdquo;
        </blockquote>

        {/* Customer Info */}
        <div className="flex items-center justify-center gap-4">
          {currentTestimonial.image && (
            <img
              src={currentTestimonial.image}
              alt={currentTestimonial.customerName}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div className="text-left">
            <p className="font-semibold text-black dark:text-white">
              {currentTestimonial.customerName}
            </p>
            {currentTestimonial.role && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {currentTestimonial.role}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Dots */}
        {testimonials.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-black dark:bg-white"
                    : "bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
