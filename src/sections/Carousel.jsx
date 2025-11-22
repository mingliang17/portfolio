import React from 'react';

const Carousel = () => {
  return (
    <div className="mh1-carousel-section h-screen w-full relative flex items-center justify-center p-0 m-0 overflow-hidden">
      <div className="absolute top-4 left-4 bg-black text-white p-3 rounded-lg z-50 text-sm font-mono">
        Viewport: {window.innerWidth} x {window.innerHeight}px
      </div>
      
      <div className="content-container flex items-center justify-between w-full max-w-7xl h-[90vh] px-8">
        {/* Image container with max constraints */}
        <div className="image-container flex-1 pr-8 h-full flex items-center justify-center">
          <div className="w-full h-full max-w-full max-h-full relative border-2 border-green-500 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src="assets/projects/projectMH1/imageMH1_1.jpg"
              alt="Adventure"
              className="w-full h-full object-contain"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>
        </div>

        <div className="description-container flex-1 text-white pl-8">
          <h2 className="carousel-title text-4xl font-bold text-yellow-500 mb-4">
            Exciting Adventure Awaits
          </h2>
          <p className="carousel-description text-lg text-gray-300 leading-relaxed mb-6">
            Experience the thrill of a lifetime with this amazing journey through the unknown. 
            Discover new horizons and explore breathtaking views. 
            Get ready to embrace the adventure!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Carousel;