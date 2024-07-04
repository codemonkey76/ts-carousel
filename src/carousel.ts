type CarouselConfig = {
  carouselSelector: string;
  slideSelector: string;
  enableNextPrevious?: boolean;
  enablePagination?: boolean;
  enableAutoplay?: boolean;
  autoplayInterval?: number;
};

type Carousel = {
  create: () => void;
  destroy: () => void;
}
export const JSCarousel = ({
  carouselSelector,
  slideSelector,
  enableNextPrevious = true,
  enablePagination = true,
  enableAutoplay = true,
  autoplayInterval = 2000,
}: CarouselConfig): Carousel | null => {
  let currentSlideIndex = 0;
  let prevBtn: HTMLElement | null = null;
  let nextBtn: HTMLElement | null = null;
  let autoplayTimer: number | undefined;
  let paginationContainer: HTMLElement | null = null;

  const carousel = document.querySelector(carouselSelector) as HTMLElement;

  if (!carousel) {
    console.error("Specify a valid selector for the carousel.");
    return null;
  }

  const slides = carousel.querySelectorAll(slideSelector) as NodeListOf<HTMLElement>;

  if (!slides.length) {
    console.error("Specify a valid selector for slides.");
    return null;
  }

  const addElement = (tag: string, attributes?: { [key: string]: string }, children?: string | (HTMLElement | string)[]): HTMLElement => {
    const element = document.createElement(tag);

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (children) {
      if (typeof children === "string") {
        element.textContent = children;
      } else {
        children.forEach((child) => {
          if (typeof child === "string") {
            element.appendChild(document.createTextNode(child));
          } else {
            element.appendChild(child);
          }
        });
      }
    }

    return element;
  };

  const tweakStructure = () => {
    carousel.setAttribute("tabindex", "0");

    const carouselInner = addElement("div", {
      class: "carousel-inner",
    });
    carousel.insertBefore(carouselInner, slides[0]);

    if (enablePagination) {
      paginationContainer = addElement("nav", {
        class: "carousel-pagination absolute mx-auto left-0 right-0",
        role: "tablist",
      });
      carousel.appendChild(paginationContainer);
    }

    slides.forEach((slide, index) => {
      carouselInner.appendChild(slide);
      slide.style.transform = `translateX(${index * 100}%)`;
      if (enablePagination && paginationContainer) {
        const paginationBtn = addElement(
          "btn",
          {
            class: `carousel-btn caroursel-btn--${index + 1}`,
            role: "tab",
          },
          `${index + 1}`
        );

        paginationContainer.appendChild(paginationBtn);

        if (index === 0) {
          paginationBtn.classList.add("carousel-btn--active");
          paginationBtn.setAttribute("aria-selected", "true");
        }

        paginationBtn.addEventListener("click", () => {
          handlePaginationBtnClick(index);
        });
      }
    });

    if (enableNextPrevious) {
      prevBtn = addElement(
        "btn",
        {
          class: "carousel-btn carousel-btn--prev-next carousel-btn--prev",
          "aria-label": "Previous Slide",
        },
        "<"
      );
      carouselInner.appendChild(prevBtn);

      nextBtn = addElement(
        "btn",
        {
          class: "carousel-btn carousel-btn--prev-next carousel-btn--next",
          "aria-label": "Next Slide",
        },
        ">"
      );
      carouselInner.appendChild(nextBtn);
    }

  };

  const resetAnimations = (element: HTMLElement) => {
    const animations = element.getAnimations({ subtree: true });
    animations.forEach((anim) => {
      anim.pause();
      anim.currentTime = 0;
    });
  };

  const playAnimations = (element: HTMLElement) => {
    const animations = element.getAnimations({ subtree: true });
    animations.forEach((anim) => anim.play());
  };

  const adjustSlidePosition = () => {
    slides.forEach((slide, i) => {
      slide.style.transform = `translateX(${100 * (i - currentSlideIndex)}%)`;
    });
  };

  const updatePaginationBtns = () => {
    if (paginationContainer) {
      const paginationBtns = paginationContainer.children;
      const prevActiveBtns = Array.from(paginationBtns).filter((btn) =>
        btn.classList.contains("carousel-btn--active")
      );
      prevActiveBtns.forEach((btn) => {
        btn.classList.remove("carousel-btn--active");
        btn.removeAttribute("aria-selected");
      });

      const currActiveBtns = paginationBtns[currentSlideIndex];
      if (currActiveBtns) {
        currActiveBtns.classList.add("carousel-btn--active");
        currActiveBtns.setAttribute("aria-selected", "true");
      }
    }
  };

  const updateCarouselState = () => {
    if (enablePagination) {
      updatePaginationBtns();
    }
    adjustSlidePosition();

    resetAnimations(slides[currentSlideIndex]);
    playAnimations(slides[currentSlideIndex]);
  };

  const moveSlide = (direction: "next" | "prev") => {
    const newSlideIndex =
      direction === "next"
        ? (currentSlideIndex + 1) % slides.length
        : (currentSlideIndex - 1 + slides.length) % slides.length;
    currentSlideIndex = newSlideIndex;
    updateCarouselState();
  };

  const handlePaginationBtnClick = (index: number) => {
    currentSlideIndex = index;
    updateCarouselState();
  };

  const handlePrevBtnClick = () => moveSlide("prev");
  const handleNextBtnClick = () => moveSlide("next");

  const startAutoplay = () => {
    autoplayTimer = setInterval(() => {
      moveSlide("next");
    }, autoplayInterval);
  };

  const stopAutoplay = () => clearInterval(autoplayTimer);

  const handleMouseEnter = () => stopAutoplay();
  const handleMouseLeave = () => startAutoplay();

  const handleKeyboardNav = (event: KeyboardEvent) => {
    if (!carousel.contains(event.target as Node)) return;
    if (event.defaultPrevented) return;

    switch (event.key) {
      case "ArrowLeft":
        moveSlide("prev");
        break;
      case "ArrowRight":
        moveSlide("next");
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  const attachEventListeners = () => {
    if (prevBtn) {
      prevBtn.addEventListener("click", handlePrevBtnClick);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", handleNextBtnClick);
    }
    carousel.addEventListener("keydown", handleKeyboardNav);

    if (enableAutoplay && autoplayInterval !== null) {
      carousel.addEventListener("mouseenter", handleMouseEnter);
      carousel.addEventListener("mouseleave", handleMouseLeave);
    }
  };

  const create = () => {
    tweakStructure();
    attachEventListeners();
    resetAnimations(carousel);
    if (enableAutoplay && autoplayInterval !== null) {
      startAutoplay();
    }
    playAnimations(slides[currentSlideIndex]);
  };

  const destroy = () => {
    if (prevBtn) {
      prevBtn.removeEventListener("click", handlePrevBtnClick);
    }

    if (nextBtn) {
      nextBtn.removeEventListener("click", handleNextBtnClick);
    }

    carousel.removeEventListener("keydown", handleKeyboardNav);
    if (enablePagination && paginationContainer) {
      const paginationBtns =
        paginationContainer.querySelectorAll(".carousel-btn");
      paginationBtns.forEach((btn, index) => {
        btn.removeEventListener("click", () => handlePaginationBtnClick(index));
      });
    }

    if (enableAutoplay && autoplayInterval !== null) {
      carousel.removeEventListener("mouseenter", handleMouseEnter);
      carousel.removeEventListener("mouseleave", handleMouseLeave);
      stopAutoplay();
    }
  };

  return { create, destroy };
};
