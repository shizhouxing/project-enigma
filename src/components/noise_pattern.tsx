export const NoisePattern = () => (
    <svg
      className="absolute inset-0 w-full h-full opacity-32"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 700 700"
      preserveAspectRatio="none"
    >
      <defs>
        <filter
          id="nnnoise-filter"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="linearRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.162"
            numOctaves="4"
            seed="15"
            stitchTiles="stitch"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="turbulence"
          />
          <feSpecularLighting
            surfaceScale="24"
            specularConstant="0.6"
            specularExponent="20"
            lightingColor="#ffffff"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            in="turbulence"
            result="specularLighting"
          >
            <feDistantLight azimuth="3" elevation="30" />
          </feSpecularLighting>
        </filter>
      </defs>
      <rect width="700" height="700" fill="transparent" />
      <rect
        width="700"
        height="700"
        fill="#ffffff"
        filter="url(#nnnoise-filter)"
      />
    </svg>
  );