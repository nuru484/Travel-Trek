import santoriniImage from "../../public/assets/santorini.jpg";
import baliImage from "../../public/assets/bali.jpg";
import swissAlpsImage from "../../public/assets/swiss-alps.jpg";

export const destinations = [
  {
    id: 1,
    name: "Santorini, Greece",
    image: santoriniImage,
    rating: 4.9,
    reviews: 1247,
    description:
      "Stunning sunsets and iconic blue domes overlooking the Aegean Sea",
    price: "From $899",
  },
  {
    id: 2,
    name: "Bali, Indonesia",
    image: baliImage,
    rating: 4.8,
    reviews: 956,
    description:
      "Tropical paradise with ancient temples and lush rice terraces",
    price: "From $699",
  },
  {
    id: 3,
    name: "Swiss Alps, Switzerland",
    image: swissAlpsImage,
    rating: 4.9,
    reviews: 823,
    description: "Majestic mountain peaks and pristine alpine landscapes",
    price: "From $1299",
  },
];
