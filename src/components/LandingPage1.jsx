import React from "react";
import "./LandingPage1.css";

export const LandingPage1 = () => {
  return (
    <div className="landing-page">
      <div className="div">
        <video
          className="ipad-introduction"
          autoPlay
          muted
          loop
          playsInline
          src="https://www.dropbox.com/scl/fi/zzals86wtkeb45hbd0wsg/ipad_1.mp4?rlkey=uw1ocgvb0nxhvdwu09friuk7z&st=n1gz6ulj&dl=1"
          type="video/mp4"
        />
        <div className="prophechy" />
      </div>
    </div>
  );
};
