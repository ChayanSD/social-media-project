export interface CategoryLandingPage {
  name: string;
  slug: string;
  title: string;
  metaDescription: string;
}

export const categoryLandingPages = [
  {
    name: "Quantum Science",
    slug: "quantum-science",
    title:
      "Quantum Science Forum - Explore Quantum Mechanics, Entanglement and Wave Theory",
    metaDescription:
      "Join the quantum science discussion forum at Interdimensional Cafe. Explore quantum mechanics, quantum entanglement, wave-particle duality, superposition and the latest quantum physics research.",
  },
  {
    name: "Neuroscience",
    slug: "neuroscience",
    title:
      "Neuroscience Forum - Brain Science, Neural Networks and Cognitive Research",
    metaDescription:
      "Discuss neuroscience topics at Interdimensional Cafe. Explore brain mapping, neuroplasticity, cognitive science, neural pathways and the connection between mind and consciousness.",
  },
  {
    name: "Particle Physics",
    slug: "particle-physics",
    title:
      "Particle Physics Forum - Subatomic Particles, Higgs Boson and Quantum Fields",
    metaDescription:
      "Join particle physics discussions at Interdimensional Cafe. Explore subatomic particles, the Higgs boson, quantum field theory, dark matter research and CERN discoveries.",
  },
  {
    name: "Philosophy",
    slug: "philosophy",
    title:
      "Philosophy Forum - Metaphysics, Ontology and the Nature of Reality",
    metaDescription:
      "Explore philosophy discussions at Interdimensional Cafe. Topics include metaphysics, ontology, epistemology, the nature of reality, free will, determinism and existential inquiry.",
  },
  {
    name: "Consciousness",
    slug: "consciousness",
    title: "Consciousness Forum - Awareness, Perception and the Hard Problem",
    metaDescription:
      "Discuss consciousness at Interdimensional Cafe. Explore the hard problem of consciousness, altered states, meditation and awareness, perception studies and the mind-body connection.",
  },
  {
    name: "Holographic Universe",
    slug: "holographic-universe",
    title:
      "Holographic Universe Forum - Holographic Principle, Simulation Theory and Reality",
    metaDescription:
      "Explore holographic universe theory at Interdimensional Cafe. Discuss the holographic principle, simulation theory, David Bohm's implicate order, information theory and the nature of reality.",
  },
  {
    name: "Entropy",
    slug: "entropy",
    title:
      "Entropy Forum - Thermodynamics, Information Theory and the Arrow of Time",
    metaDescription:
      "Discuss entropy and thermodynamics at Interdimensional Cafe. Topics include the second law of thermodynamics, information entropy, the arrow of time and disorder in quantum systems.",
  },
  {
    name: "Parallel Universes",
    slug: "parallel-universes",
    title:
      "Parallel Universes and Multiverse Forum - Many Worlds and Alternate Realities",
    metaDescription:
      "Explore parallel universes and multiverse theory at Interdimensional Cafe. Discuss the many-worlds interpretation, alternate dimensions, branching timelines, string theory landscapes and quantum branching.",
  },
  {
    name: "Zero Point Field",
    slug: "zero-point-field",
    title:
      "Zero Point Field Forum - Vacuum Energy, Quantum Fluctuations and ZPE",
    metaDescription:
      "Discuss the zero point field at Interdimensional Cafe. Explore zero point energy, vacuum fluctuations, quantum foam, Casimir effect research and the physics of empty space.",
  },
  {
    name: "Spiritual Awakening",
    slug: "spiritual-awakening",
    title:
      "Spiritual Awakening Forum - Enlightenment, Kundalini and Inner Transformation",
    metaDescription:
      "Join the spiritual awakening forum at Interdimensional Cafe. Discuss kundalini rising, spiritual enlightenment, inner transformation, energy shifts, dark night of the soul and awakening symptoms.",
  },
  {
    name: "Frequency",
    slug: "frequency",
    title:
      "Frequency Forum - Vibration, Sound Healing, Solfeggio and Energy Resonance",
    metaDescription:
      "Explore frequency and vibration at Interdimensional Cafe. Discuss sound healing, Solfeggio frequencies, cymatics, resonance theory, 432 Hz tuning and vibrational energy.",
  },
  {
    name: "Astrology",
    slug: "astrology",
    title:
      "Astrology Forum - Birth Charts, Transits, Zodiac Signs and Planetary Alignments",
    metaDescription:
      "Join the astrology discussion forum at Interdimensional Cafe. Explore natal charts, planetary transits, zodiac signs, houses, aspects, retrograde cycles and astrological forecasting.",
  },
  {
    name: "Astronomy",
    slug: "astronomy",
    title:
      "Astronomy Forum - Space Science, Exoplanets, Galaxies and the Observable Universe",
    metaDescription:
      "Discuss astronomy at Interdimensional Cafe. Explore galaxies, exoplanet discoveries, black holes, dark energy, space telescopes, stellar evolution and cosmology.",
  },
  {
    name: "Galactic / ETs",
    slug: "galactic-ets",
    title:
      "Galactic and Extraterrestrial Forum - UFOs, Contact, Disclosure and Cosmic Intelligence",
    metaDescription:
      "Explore galactic and extraterrestrial topics at Interdimensional Cafe. Discuss UFO sightings, extraterrestrial contact, disclosure movements, cosmic intelligence, ancient astronaut theories and space consciousness.",
  },
] as const satisfies CategoryLandingPage[];

export function getCategoryLandingPageBySlug(slug: string) {
  return categoryLandingPages.find((category) => category.slug === slug) ?? null;
}
