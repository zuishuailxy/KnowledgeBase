import React from "react";
import { useWatermark } from "../hooks/useWatermark";

const WaterMark = () => {
  const [updateWatermark, options] = useWatermark({ content: "Sample Watermark", rotate: -10 });
  const update = () => {
    updateWatermark({ content: "Updated Watermark" });
  }

  return <div>{options.content}

    <button onClick={update}>update</button>
  </div>;
};

export default WaterMark;
