import React, { useState, useRef, useCallback } from "react";
import "../SliderCaptcha.css";

interface SliderCaptchaProps {
  onSuccess?: () => void;
  width?: number;
  height?: number;
}

const SliderCaptcha: React.FC<SliderCaptchaProps> = ({
  onSuccess,
  width = 300,
  height = 50,
}) => {
  const [sliderX, setSliderX] = useState<number>(0);
  const [verified, setVerified] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Drag / touch handlers
  const handleMove = useCallback(
    (clientX: number) => {
      if (verified || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      let newX = clientX - rect.left - height / 2;

      // constrain
      if (newX < 0) newX = 0;
      if (newX > width - height) newX = width - height;

      setSliderX(newX);

      // verify if slider reached end
      if (newX >= width - height - 2) {
        setVerified(true);
        onSuccess?.();
      }
    },
    [height, verified, width, onSuccess],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => handleMove(e.clientX),
    [handleMove],
  );
  const handleTouchMove = useCallback(
    (e: TouchEvent) => handleMove(e.touches[0].clientX),
    [handleMove],
  );

  const handleMouseUp = useCallback(() => {
    if (!verified) setSliderX(0);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [verified, handleMouseMove]);

  const handleTouchEnd = useCallback(() => {
    if (!verified) setSliderX(0);
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);
  }, [verified, handleTouchMove]);

  const handleMouseDown = () => {
    if (verified) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = () => {
    if (verified) return;
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div
      className="slider-captcha"
      style={{ width: `${width}px`, height: `${height}px` }}
      ref={sliderRef}
    >
      <div
        className={`slider-track ${verified ? "verified" : ""}`}
        style={{ height: `${height}px` }}
      >
        {verified ? "✔ Verified" : "Slide to verify"}
      </div>
      <div
        className="slider-handle"
        style={{
          width: `${height}px`,
          height: `${height}px`,
          left: `${sliderX}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      ></div>
    </div>
  );
};

export default SliderCaptcha;
