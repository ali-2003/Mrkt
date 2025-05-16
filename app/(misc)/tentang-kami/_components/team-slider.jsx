"use client"

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { mainSlider9 } from "@/utils/data";
import OwlCarousel from "@/components/features/owl-carousel";

const TeamSlider = ({ about }) => {
  return (
    <OwlCarousel adClass="owl-simple" options={mainSlider9}>
      {about?.ourTeam?.map((team, index) => (
        <div className="member member-anim text-center">
          <figure className="member-media">
            <div className="lazy-overlay"></div>
            <Image alt="member" src={urlFor(team?.image)?.url()} height={500} width={376} />

            <figcaption className="member-overlay">
              <div className="member-overlay-content">
                <h3 className="member-title">
                  {team?.name}
                  <span>{team?.role}</span>
                </h3>
                <p>{team?.description}</p>
                <div className="social-icons social-icons-simple">
                  {team?.social?.map((social, index) => (
                    <Link href={social?.link} className="social-icon" title={social?.icon}>
                      <i className={socialIcons?.[social?.icon]}></i>
                    </Link>
                  ))}
                </div>
              </div>
            </figcaption>
          </figure>

          <div className="member-content">
            <h3 className="member-title">
              {team?.name}
              <span>{team?.role}</span>
            </h3>
          </div>
        </div>
      ))}
    </OwlCarousel>
  );
};

export default TeamSlider;
