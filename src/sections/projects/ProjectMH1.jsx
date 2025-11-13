import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ProjectMH1 = () => {
  const titleRef = useRef(null);
  const imgRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Wait a bit to ensure navbar height is calculated
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=150%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true, // Important for dynamic heights
          },
        });

        tl.fromTo(
          imgRef.current,
          { opacity: 0.3 },
          { opacity: 1, ease: "none", duration: 2 },
          0
        )
        .fromTo(
          titleRef.current,
          { opacity: 1 },
          { opacity: 0, ease: "none", duration: 2 },
          0
        )
        .to({}, { duration: 1 });
      });

      return () => {
        ctx.revert();
      };
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full overflow-hidden border-green-400 ">
      <section
        ref={sectionRef}
        className="relative flex justify-center items-center mb-40"
        style={{ 
          height: '100vh',
        }}
      >
        <img
          ref={imgRef}
          src="/portfolio/assets/projects/projectMH1/imageMH1_1.jpg"
          alt="Project MH1 Main"
          className="h-full object-cover mx-auto opacity-30"
        />

        <h1
          ref={titleRef}
          className="absolute z-10 text-white text-6xl md:text-9xl font-bold text-center"
        >
          Project MH1
        </h1>
      </section>

      <section className="h-screen w-full">
        <img
          src="/portfolio/assets/projects/projectMH1/imageMH1_2.jpg"
          alt="Project MH1 Secondary"
          className="w-full h-full object-cover"
        />
      </section>
    </div>
  );
};

export default ProjectMH1;