const gaugesHeroBackground = {
  id: "gauges-hero",
  kind: "image" as const,
  url: "https://res.cloudinary.com/pwebsite/image/upload/v1720455000/shotguns/gauges/perazzi-gauge-hero.jpg",
  alt: "Perazzi barrels and frames laid out on a walnut bench highlighting gauge differences",
  aspectRatio: 16 / 9,
};

export const gaugesHero = {
  title: "Gauges & balance",
  subheading:
    "Gauge, frame mass, and barrel contour shape how a Perazzi moves, recovers, and settles after the shot.",
  background: gaugesHeroBackground,
};

export const gaugesEditorialHtml = `<p>Perazzi tunes the voice of each gauge through fitting and barrel contouring. Twelve gauge frames carry authority for bunker and demanding sporting layouts—calm momentum with the ballast to stay on plane. Twenty and twenty-eight gauge sets favor agility, letting the gun spark into motion for skeet crosses or mixed presentations. Even the .410 can be balanced to your touch, training rhythm and precision.</p>`;

export const gaugesSidebarHtml = `<p>Pattern boards and tunnel testing reveal how rib height and choke harmonics steer point of impact. High or adjustable ribs support rising targets and sustained leads; flat tapers provide a versatile sight picture for mixed courses.</p><p>Work with the atelier to map where the pattern lives and how the gun feels as you move, and revisit the <a href="/shotguns/disciplines/trap">Trap</a> and <a href="/shotguns/disciplines/sporting">Sporting</a> guides for discipline-specific setup notes.</p>`;

export const gaugesFaq = [
  {
    q: "How does gauge affect felt recoil and recovery?",
    a: "12 gauge offers stable mass and smooth recovery; 20 and 28 gauge favor agility and speed—final feel is tuned during fitting with stock geometry and barrel contour.",
  },
  {
    q: "When choose high vs flat ribs?",
    a: "High or adjustable ribs aid rising targets and sustained leads; flat or low ramp ribs provide a versatile sight picture for mixed presentations.",
  },
  {
    q: "Does barrel length change my swing?",
    a: "Longer barrels steady and lengthen the swing; shorter barrels increase reactivity. Both can be balanced to your style with ballast and rib choices.",
  },
];
