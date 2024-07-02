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
  /*
   * Initialize variables to keep track of carousel state and
   * references to different elements.
   */
  let currentSlideIndex = 0;
  let prevBtn: HTMLElement | null = null;
  let nextBtn: HTMLElement | null = null;
  let autoplayTimer: number | undefined;
  let paginationContainer: HTMLElement | null = null;

  // Find the carousel element in the DOM.
  const carousel = document.querySelector(carouselSelector) as HTMLElement;

  // If carousel element is not found, log an error and exit.
  if (!carousel) {
    console.error("Specify a valid selector for the carousel.");
    return null;
  }

  // Find all slides within the carousel
  const slides = carousel.querySelectorAll(slideSelector) as NodeListOf<HTMLElement>;

  // If no slides are found, log an error and exit.
  if (!slides.length) {
    console.error("Specify a valid selector for slides.");
    return null;
  }

  /*
   * Utility function to create and append HTML elements with
   * attributes and children.
   */
  const addElement = (tag: string, attributes?: { [key: string]: string }, children?: string | (HTMLElement | string)[]): HTMLElement => {
    const element = document.createElement(tag);

    if (attributes) {
      // Set attributes to the element.
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (children) {
      // Set content to the element.
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

  /*
   * Modify the DOM structure and add required containers and controls
   * to the carousel element.
   */
  const tweakStructure = () => {
    carousel.setAttribute("tabindex", "0");

    // Create a div for carousel inner content.
    const carouselInner = addElement("div", {
      class: "carousel-inner",
    });
    carousel.insertBefore(carouselInner, slides[0]);

    // If pagination is enabled, create and append pagination buttons.
    if (enablePagination) {
      paginationContainer = addElement("nav", {
        class: "carousel-pagination absolute mx-auto left-0 right-0",
        role: "tablist",
      });
      carousel.appendChild(paginationContainer);
    }

    /*
     * Move slides from the carousel element to the carousel inner
     * container to facilitate alignment.
     */
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
      // Create and append previous button.
      prevBtn = addElement(
        "btn",
        {
          class: "carousel-btn carousel-btn--prev-next carousel-btn--prev",
          "aria-label": "Previous Slide",
        },
        "<"
      );
      carouselInner.appendChild(prevBtn);

      // Create and append next button.
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

  const pauseAnimations = (element: HTMLElement) => {
    element.getAnimations({ subtree: true }).forEach((anim) => anim.pause());
  }

  const resetAnimations = (element: HTMLElement) => {
    element.getAnimations({ subtree: true }).forEach((anim) => anim.currentTime = 0);
  }

  const playAnimations = (element: HTMLElement) => {
    element.getAnimations({ subtree: true }).forEach((anim) => anim.play());
  }

  // Adjust slide positions according to the currently selected slide.
  const adjustSlidePosition = () => {
    pauseAnimations(carousel);

    slides.forEach((slide, i) => {
      if (i === currentSlideIndex) {
        resetAnimations(slide);
      }
      slide.style.transform = `translateX(${100 * (i - currentSlideIndex)}%)`;
      if (i === currentSlideIndex) {
        playAnimations(slide);
      }
    });
  };

  /*
   * Update the state of pagination buttons according to the currently
   * selected slide.
   */
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

  // Update the overall carousel state.
  const updateCarouselState = () => {
    if (enablePagination) {
      updatePaginationBtns();
    }
    adjustSlidePosition();
  };

  // Move slide left and right based on direction provided.
  const moveSlide = (direction: "next" | "prev") => {
    const newSlideIndex =
      direction === "next"
        ? (currentSlideIndex + 1) % slides.length
        : (currentSlideIndex - 1 + slides.length) % slides.length;
    currentSlideIndex = newSlideIndex;
    updateCarouselState();
  };

  // Event handler for pagination button click event.
  const handlePaginationBtnClick = (index: number) => {
    currentSlideIndex = index;
    updateCarouselState();
  };

  // Event handlers for previous and next button clicks.
  const handlePrevBtnClick = () => moveSlide("prev");
  const handleNextBtnClick = () => moveSlide("next");

  // Start autoplaying of slides.
  const startAutoplay = () => {
    autoplayTimer = setInterval(() => {
      moveSlide("next");
    }, autoplayInterval);
  };

  // Stop autoplaying of slides.
  const stopAutoplay = () => clearInterval(autoplayTimer);

  /* Event handlers to manage autoplaying intelligentally on mouse
   * enter and leave events.
   */
  const handleMouseEnter = () => stopAutoplay();
  const handleMouseLeave = () => startAutoplay();

  // Event handler for keyboard navigation.
  const handleKeyboardNav = (event: KeyboardEvent) => {
    // Exit, if carousel is not the event target.
    if (!carousel.contains(event.target as Node)) return;
    // Exit, if the default action on the event is already prevented.
    if (event.defaultPrevented) return;

    /*
     * Move slides in the respective directions when left and right
     * keys are pressed.
     */
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

    /*
     * Stop the default actions of the event in question when the
     * carousel is the event target.
     */
    event.preventDefault();
  };

  // Attach event listeners to relevant elements.
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

  // Initialize/create the carousel.
  const create = () => {
    tweakStructure();
    attachEventListeners();
    if (enableAutoplay && autoplayInterval !== null) {
      startAutoplay();
    }
  };

  // Destroy the carousel/clean-up.
  const destroy = () => {
    // Remove event listeners.
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

    // Clear autoplay intervals if autoplay is enabled.
    if (enableAutoplay && autoplayInterval !== null) {
      carousel.removeEventListener("mouseenter", handleMouseEnter);
      carousel.removeEventListener("mouseleave", handleMouseLeave);
      stopAutoplay();
    }
  };

  // Return an object with methods to create and destroy the carousel.
  return { create, destroy };
};
