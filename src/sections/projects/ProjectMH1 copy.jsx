import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const ProjectMH1 = () => {
  const titleRef = useRef(null);
  const imgRef = useRef(null);
  const [overlayEl, setOverlayEl] = useState(null);

  // Title animation on mount
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    tl.fromTo(
      titleRef.current,
      { x: -200, opacity: 0 },
      { x: 0, opacity: 1, duration: 2 }
    );
  }, []);

  // Hover-zoom image
  const handleMouseEnter = () => {
    if (overlayEl) return;

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;
    overlay.style.cursor = "zoom-out";

    const clone = imgRef.current.cloneNode(true);
    clone.style.maxWidth = "110vw";
    clone.style.maxHeight = "110vh";
    clone.style.objectFit = "contain";
    overlay.appendChild(clone);

    document.body.appendChild(overlay);
    setOverlayEl(overlay);

    gsap.fromTo(clone, { scale: 0.7, opacity: 0 }, { scale: 0.9, opacity: 1, duration: 0.5, ease: "power2.out" });

    // Remove overlay when mouse leaves the zoomed image
    clone.addEventListener("mouseleave", () => {
      gsap.to(clone, {
        scale: 0.7,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          overlay.remove();
          setOverlayEl(null);
        },
      });
    });
  };

  return (
    <div className="flex flex-col justify-center items-center mt-20 space-y-10">
      {/* Animated Title */}
      <div
        ref={titleRef}
        className="text-4xl font-bold p-4"
      >
        Project MH1
      </div>

      {/* Image with hover zoom */}
      <img
        ref={imgRef}
        src="/portfolio/assets/projects/projectMH1/imageMH1_1.jpg"
        alt="Project MH1 Main"
        className="max-h-[50vh] max-w-[50vw] object-contain cursor-pointer"
        onMouseEnter={handleMouseEnter}
      />
    </div>
  );
};

export default ProjectMH1;
