import './style.css'
import { JSCarousel } from './carousel.ts'

const carousel1 = JSCarousel({
  carouselSelector: "#carousel-1",
  slideSelector: ".slide",
  enableNextPrevious: false,
  enablePagination: true,
  enableAutoplay: false
});

if (carousel1) {
  carousel1.create();
}

window.addEventListener("unload", () => {
  if (carousel1) {
    carousel1.destroy();
  }
});

