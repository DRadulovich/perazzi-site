# HOME PAGE

## Hero Section

* [ ] Add depth zoom or breathing effect
* [ ] Multi layered entrance animation
* [ ] Fix the "Manifesto" pop-up

## Craftsmanship Journey Section

* [ ] Build a "Full Screen Story Immersion" that allows users to enter fullscreen with slides for each "Build Station" and navigate from station to station

## Need a Guide Section

* [ ] Do something visually or layout wise so it looks more intentional

## Champion Spotlight Section

* [ ] Make quote scroll as if being hand written

## CTA Section

* [ ] Correct Links:
    - Book a Fitting Slug -> `/experience#experience-booking-guide`
    - Explore Bespoke Process Slug -> `/bespoke`

---

# SHOTGUNS PAGE

## Hero Section

* [ ] Same as Home Page Hero

## Platforms & Lineages Section

* [ ] Remove bounce animation from Platform Card Hover
* [ ] Make background image not resize/jump when changing Platform Cards
* [ ] Possibly have quotes scroll like being handwritten

## Geometry of Rhythm Section

* [ ] Do something visually or layout wise so it looks more intentional

## Disciplines & Purpose Section

* [ ] Make background image not resize or jump when changing disciplines
* [ ] Figure out a better way to make the most popular models look more aesthetically pleasing

## Gauge Selection Section

* [ ] Do something visually or layout wise so it looks more intentional

## Trigger Types Section

* [ ] N/A

## Choose with Intent Section

* [ ] Do something visually or layout wise so it looks more intentional

## Engravings & Grades Section

* [ ] Make background image not resize or jump when changing engraving grades
* [ ] Find a way to map the view engraving button to load only the filtered engravings for that specific grade

# BESPOKE JOURNEY PAGE

## The Bespoke Build Section

* [ ] Create full screen story immersion that allows users to enter full screen with slides for each build step and navigate from step to step, similar to the home page, craftsmanship journey section
* [ ] Make the active step highlight be rounded-sm shape
* [ ] Map the "Begin the ritual" button to the full screen immersion
* [ ] Correct the skip step-by-step button so that it actually skips

## Need a Bespoke Guide Section

* [ ] Do something visually or layout-wise so it looks more intentional

## Atelier Team Section

* [ ] Figure out what Al wants to do with this section

# HERITAGE PAGE

## Perazzi Heritage Eras Section

* [ ] Eventually change this whole section into a full screen immersive navigatable scroller with its own route. 


[-----------------------------------------------------------]

Okay, I need your help (screenshot attached to this message in the chat for context) -- I am trying to figure out a way to make these sections feel more intentional instead of just a full screen of somewhat awkwardly laid out text. Here's some context to help you understand the purpose of each one:

---
# Context

* Each one of these sections is supposed to be a child section to the parent section that is above it on the page
* The goal of them is to somewhat add context or explain or pull together the information that is in the component sitting above it on the front-end of the website. 
* The other goal of them is to somewhat be a CTA to pull people into using the Assistant by having a ChatTriggerButton that is an automated query into the Assistant API. 

---

# Goals:

* I want to figure out a way to add to the aesthetic design of the website with this as opposed to what they currently are, which is just a bunch of text, as you can see in a screenshot of one of them as an example. 
* I also want them to be more engaging and draw the user in to interacting with the assistant. 
* At the same time, though, I don't want to draw attention away from their parent section above because this should be an addition to that, not the main attraction. 
* I really need to figure out a way to make these sections more aesthetically pleasing and beautiful in a way that ties together with the rest of the website. 
* Each one of these sections also acts as a visual break to separate the components on top and below of them. That way, there is a natural, consecutive sections within the website that feel like they're supposed to make sense. 

---

# Request for ChatGPT:

* Could you please audit them and propose a couple different ideas as to how we can level them up so to speak and make them feel not just like a wall of text But still accomplish everything that I listed in the goals section. 
* I'm not looking for a massive refactor and completely changing the way that they work. But I really do want some ideas on the layout, or the design, or the interactability, or visual language, or something.

---

# Subsection Locations & Names

## Home Page
* HomeGuideSection
    - Need a Guide?

## Shotguns Page -> `/shotguns`
* ShotgunsAdvisorySection
    - The Geometry of Rhythm
    - Gauge Selection
    - Choose with Intent

## Bespoke Page -> `/bespoke`
* BespokeGuideSection
    - Need a Bespoke Guide?

## Experience Page -> `/experience`
* ExperienceAdvisorySection
    - Visit Planning
    - Fitting Guidance
    - Meet Us on the Road

## Heritage Page -> `/heritage`
* HeritageSplitSection
    - Ask the Workshop
    - Champions Past and Present
    - Inside the Botticino Atelier