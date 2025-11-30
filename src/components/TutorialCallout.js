import React, { useRef, useEffect } from 'react';
import './TutorialCallout.css'; // You’ll define styles below

const demoCard = {
  name: "Charizard",
  images: {
    large: "https://images.pokemontcg.io/base1/4_hires.png"
  }
};

const TutorialCallout = () => {
  const cardRef = useRef(null);

  const maxTilt = 15; // Degrees

  const handleMove = (x, y, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;

    const rotateY = ((x - centerX) / centerX) * maxTilt; // Left-right tilt
    const rotateX = ((centerY - y) / centerY) * maxTilt; // Up-down tilt

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  };

  const resetTilt = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };

  useEffect(() => {
    const card = cardRef.current;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handleMove(x, y, rect.width, rect.height);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = card.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        handleMove(x, y, rect.width, rect.height);
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', resetTilt);
    card.addEventListener('touchmove', handleTouchMove);
    card.addEventListener('touchend', resetTilt);
    card.addEventListener('touchcancel', resetTilt);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', resetTilt);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', resetTilt);
      card.removeEventListener('touchcancel', resetTilt);
    };
  }, []);

  return (
   <section className="tutorial-callout-wrapper">
  <h2>Try the Interactive 3D Card OPEN PACKS ON PUMPFUN!</h2>
  <div className="tutorial-content">
    <div className="instruction-text">
  <h3>How It Works</h3>
  <ul>
    <li>🎴 Open Pokémon card packs — one at a time or 10 at once.</li>
    <li>📦 Collect and organize your favorite cards in your collection.</li>
    <li>🌀 View your cards in 3D — tilt and interact for a full effect.</li>
    <li>💰 Instantly check each card’s average market price.</li>
    <li>📊 See your most and least valuable cards at a glance.</li>
    <li>🗑️ Remove any cards you no longer want in your deck.</li>
  </ul>
</div>

    <div className="card-viewer">
      <div className="card-tilt-container" ref={cardRef}>
        <img
          src={demoCard.images.large}
          alt={demoCard.name}
          className="card-image"
        />
      </div>
      <p>Hover or drag to see the 3D effect!</p>
    </div>
  </div>
</section>

  );
};

export default TutorialCallout;
