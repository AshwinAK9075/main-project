"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface PlotMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  interactive?: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  height?: string;
  projectName?: string;
  className?: string;
}

// Inner Leaflet component dynamically loaded only on client
const MapInner = dynamic(
  () =>
    Promise.resolve(function MapInnerComponent({
      latitude,
      longitude,
      zoom = 13,
      interactive = false,
      onCoordinatesChange,
      projectName,
    }: PlotMapProps) {
      const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = require("react-leaflet");
      const L = require("leaflet");

      // Fix default Leaflet icon assets missing in Next.js build
      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      function LocationMarker() {
        useMapEvents({
          click(e: any) {
            if (interactive && onCoordinatesChange) {
              onCoordinatesChange(
                parseFloat(e.latlng.lat.toFixed(6)),
                parseFloat(e.latlng.lng.toFixed(6))
              );
            }
          },
        });

        return (
          <Marker position={[latitude, longitude]} icon={defaultIcon}>
            <Popup>
              <div className="text-xs">
                <strong>{projectName || "Forest Carbon Plot"}</strong>
                <br />
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        );
      }

      return (
        <MapContainer
          center={[latitude, longitude]}
          zoom={zoom}
          scrollWheelZoom={false}
          className="h-full w-full rounded-lg"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      );
    }),
  { ssr: false }
);

export function PlotMap(props: PlotMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-muted border text-xs text-muted-foreground"
        style={{ height: props.height || "300px" }}
      >
        Loading OpenStreetMap tiles...
      </div>
    );
  }

  return (
    <div style={{ height: props.height || "300px" }} className="w-full relative z-0">
      <MapInner {...props} />
    </div>
  );
}
