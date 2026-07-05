"use client";

import React from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "./Hero";
import { Manifest } from "./Manifest";
import { RulerTick } from "./RulerTick";
import { FlightPlan } from "./FlightPlan";
import { Engineering } from "./Engineering";
import { Boarding } from "./Boarding";
import { Footer } from "./Footer";
import "./landing.css";

export const Landing = () => (
  <div className="landing-root">
    <Nav />
    <Hero />
    <Manifest />
    <FlightPlan />
    <RulerTick label="Engineering" />
    <Engineering />
    <RulerTick label="Get started" />
    <Boarding />
    <Footer />
  </div>
);
