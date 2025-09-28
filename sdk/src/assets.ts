/**
 * Static assets for GrowthKit SDK
 * Embedded as base64 to ensure they're always available
 */

export const GROWTHKIT_LOGO_ICON_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAACDElEQVRIDe1Qz2sTQRR+M/szm2yVloKgELyUxranBq0eRb0rTUFQKNpb/wHRSxC8iAqCHioIgmgxKnoRT1It4qmWFq1YFRGhYhqr2TRNZvNmZ0wPgWXoJpF6UTqXed+8733fmw9g6/yzCZzzxoYyMqO1+oDeiqD2c3XRqeLui2Uhh5P57Xvq/TWVE8Z/ZJCRWfNegU50uPYo98Sy7kvz7xlIICtf3UuOGxsteRTMmvzuFmg5vO1Gdds/OPDhRpqZ2rj4qYF04oA19mAyfRI3Eg2/0TBoVle5O4Cyi/rQCaUiXajXV9f5Bz8/Sw7OzBhRs5EG++dyOwfnn+xrDAbc+YboAmPWMgZWZrUqtL2L05crnD61E8xu8NQ7MqI1Ht/FNXu6b/b5Q8r88526+bJQhiWC5BSTHTHdMV7pZqJXrJbe9AwsVVThBo40ENz6EvhmhSYSxwMdj+R/1MYtIxjh6P4ShvECUe8OyhoQZjy6T0aChqB6R0b0duhQvj78WFRtEMzqEsS9jSWHc988AWRbt6w5IFZqU7ZHr6iiYRxpsE4iqJ+VRT4HQRwkOgYG9gXwjX7JTJAe3oqje/T14bQXFlRroj6ouC+3sAMteh202DHpV4oawifQyeT74VTTzVWdpjgLWdp7d/FMz52Pfv/N+dNNyZtppibejaWuzSY3o9HGrGwZaxsiW5T/KYHfjWfJJrEJnEEAAAAASUVORK5CYII=";

/**
 * Logo component as React element
 * @param size - Size in pixels (both width and height)
 * @param className - Optional CSS class
 * @param style - Optional CSS styles
 */
export interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}
