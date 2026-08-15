---
name: Full-Stack-Development
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.
## Frontend Design & UI/UX Philosophy

Every frontend must feel intentionally crafted by a senior UI/UX designer—not generated from a template.

The goal is to create memorable digital experiences where motion, layout, typography, interaction, and storytelling work together.

### Design First

Before writing any code:

- Invent a unique design language with a project codename.
- Define the emotional goal (luxury, futuristic, editorial, brutalist, organic, playful, experimental, etc.).
- Build the entire interface around that vision.
- Never reuse layouts, spacing systems, navigation styles, or animation patterns from previous projects.

Every project should immediately look different.

---

### Layout Composition

Avoid predictable website structures.

Instead prefer combinations of:

- Broken grids
- Editorial compositions
- Layered sections
- Overlapping elements
- Floating content
- Asymmetrical layouts
- Dynamic spacing
- Diagonal compositions
- Sticky storytelling
- Horizontal scrolling experiences
- Scroll-controlled narratives
- Split-screen transitions
- Bento layouts that evolve while scrolling
- Experimental navigation systems

Never produce another generic hero → cards → testimonials → pricing → footer layout.

---

### Motion & Interaction

Motion is a core design language—not decoration.

Use premium interaction patterns such as:

- GSAP timelines
- ScrollTrigger
- Lenis smooth scrolling
- Sticky pinned sections
- Scroll-driven storytelling
- Text masking
- Character-by-character typography animation
- Image sequence reveals
- Layout morphing
- Card stacking
- Magnetic buttons
- Cursor physics
- Hover depth
- SVG morphing
- Clip-path reveals
- Parallax layers
- Infinite marquees
- Animated backgrounds
- Section transitions
- Page transitions
- Perspective transforms
- Physics-inspired interactions

Avoid repetitive fade-up animations.

Every major section should introduce a new interaction.

---

### Typography

Typography should become part of the experience.

Avoid:

- Inter
- Arial
- Roboto
- Generic system fonts

Prefer expressive font pairings that match the concept.

Use:

- Oversized headlines
- Editorial layouts
- Variable fonts
- Animated typography
- Layered text
- Masked text
- Kinetic typography

Typography should guide attention through movement and hierarchy.

---

### Color & Visual Identity

Every project must establish its own visual identity.

Never reuse:

- Purple SaaS gradients
- Blue startup palettes
- Generic glassmorphism
- Default Tailwind colors
- Predictable gradients

Create:

- Custom color systems
- Material-inspired surfaces
- Rich textures
- Noise overlays
- SVG patterns
- Custom illustrations
- Procedural backgrounds
- CSS masks
- Canvas effects
- WebGL scenes when appropriate

Use gradients only if they genuinely support the concept.

---

### Components

Avoid generic UI libraries as the primary visual language.

Instead create custom experiences:

- Morphing buttons
- Interactive timelines
- Scroll stories
- Animated showcases
- Signature navigation
- Experimental galleries
- Sticky feature reveals
- Floating menus
- Animated cards
- Interactive statistics
- Creative loaders
- Immersive footers

Each component should have its own identity.

---

### Originality Rules

Never repeat:

- Hero sections
- Navigation bars
- Card designs
- Footer layouts
- Scroll animations
- Color systems
- Typography combinations
- Grid systems
- Section ordering

Every project must feel like a completely different product.

---

### Inspiration

Aim for the craftsmanship seen on:

- Awwwards
- FWA
- Godly
- CSS Design Awards
- Lapa Ninja

Never copy.

Study the design principles and create an original interpretation.

---

### Final Validation

Before completing any project ask:

- Does this look handcrafted?
- Would a designer recognize a unique visual language?
- Does scrolling feel immersive?
- Is the interaction memorable?
- Does every section introduce something new?
- Have I avoided common AI website patterns?
- Would this stand out on Awwwards?

If any answer is **No**, redesign before generating the final implementation.
## Backend & System Design

Before implementing any backend or architecture, first understand the system:

- **Purpose**: What problem does the system solve? Who are the users? What is the expected scale?
- **Traffic Profile**: Estimate concurrent users, requests per second, data growth, read/write ratio, and latency requirements.
- **Constraints**: Budget, infrastructure, language/framework, deployment model, compliance, security, and availability requirements.
- **Failure Scenarios**: Design assuming components will fail. Identify bottlenecks and recovery strategies.
- **Differentiation**: Optimize for simplicity first, then scalability. Avoid unnecessary complexity.

## Architecture Principles

Design systems that are:

- Modular and loosely coupled
- Horizontally scalable
- Observable (logging, metrics, tracing)
- Fault tolerant
- Secure by default
- Easy to maintain and extend

Choose the simplest architecture that satisfies the requirements. Introduce complexity only when justified.

## API Design

- Follow REST or GraphQL best practices based on the use case.
- Maintain consistent naming conventions.
- Use proper HTTP status codes.
- Implement validation at every boundary.
- Return structured error responses.
- Support pagination, filtering, sorting, and search where appropriate.
- Version APIs when introducing breaking changes.

## Database Design

Design schemas for both correctness and performance.

Consider:
- Normalization vs denormalization
- Indexing strategy
- Read/write patterns
- Query optimization
- Partitioning or sharding when necessary
- Data retention policies
- Backup and recovery

Choose SQL for strong consistency and relational workloads. Choose NoSQL only when it clearly benefits the application's access patterns.

## Caching

Use caching intentionally.

Possible layers:
- Browser cache
- CDN
- Reverse proxy
- Application cache
- Distributed cache (Redis)

Prevent cache stampedes using techniques like:
- Mutex locking
- Request coalescing
- Stale-while-revalidate
- Randomized TTL
- Background refresh

## Concurrency

Handle concurrent operations safely.

Consider:
- Race conditions
- Distributed locking
- Optimistic locking
- Pessimistic locking
- Idempotency
- Atomic operations
- Event ordering

## Scalability

Design for growth.

Consider:
- Horizontal scaling
- Load balancing
- Stateless services
- Background workers
- Message queues
- Event-driven architecture
- Database replicas
- CDN usage

Avoid premature optimization while ensuring future scalability.

## Performance

Identify critical paths.

Optimize:
- Database queries
- Network round trips
- Serialization
- Memory usage
- CPU-intensive tasks
- Async processing
- Connection pooling

Always measure before optimizing.

## Reliability

Design for resilience.

Include:
- Retries with exponential backoff
- Circuit breakers
- Timeouts
- Dead-letter queues
- Health checks
- Graceful shutdown
- Disaster recovery

Avoid single points of failure.

## Security

Security is mandatory, not optional.

Always consider:
- Authentication
- Authorization (RBAC/ABAC)
- Input validation
- SQL Injection
- XSS
- CSRF
- SSRF
- IDOR
- Rate limiting
- Secure session management
- Secret management
- Encryption in transit and at rest
- Principle of least privilege

Never trust client-side validation.

## Observability

Every production system should include:

- Structured logging
- Metrics
- Distributed tracing
- Monitoring dashboards
- Alerting
- Audit logs

Design systems so failures can be diagnosed quickly.

## Deployment

Prefer modern deployment practices.

Consider:
- Docker
- Kubernetes (when appropriate)
- CI/CD
- Blue-Green deployments
- Rolling updates
- Canary releases
- Infrastructure as Code
- Environment isolation

## Code Quality

Backend code should be:

- Clean
- Modular
- Testable
- Well-documented
- Consistent
- Production-ready

Avoid unnecessary abstractions, duplicated logic, and over-engineering.

## Output Expectations

When asked to design a backend or system:

- Explain architectural decisions.
- Include architecture diagrams (Mermaid) when useful.
- Describe request/data flow.
- Discuss trade-offs.
- Identify bottlenecks.
- Explain scaling strategy.
- Cover security considerations.
- Recommend database schema and indexing.
- Describe caching strategy.
- Explain deployment architecture.
- Mention monitoring and observability.
- Produce production-grade code that follows industry best practices rather than simplified examples.
## File Structure

Organize projects with a clear, scalable, production-ready structure. Avoid dumping everything into a few files.

### General Principles

- Group files by feature rather than file type whenever practical.
- Keep related components, hooks, services, and tests together.
- Separate business logic from presentation.
- Avoid circular dependencies.
- Use meaningful, consistent naming conventions.
- Keep modules focused on a single responsibility.

### Frontend Structure

A frontend project should typically separate:

- Components
- Pages / Routes
- Layouts
- Hooks
- Context / State
- Services / API
- Utilities
- Types
- Styles
- Assets
- Constants
- Config
- Tests

Example:

```text
src/
├── app/
├── components/
│   ├── ui/
│   └── features/
├── layouts/
├── hooks/
├── services/
├── lib/
├── utils/
├── types/
├── constants/
├── styles/
├── assets/
├── context/
├── store/
├── config/
└── tests/
```

### Backend Structure

Separate responsibilities clearly.

A backend project should typically include:

- Routes
- Controllers
- Services
- Repositories / Data Access
- Models
- Middleware
- Validators
- Authentication
- Authorization
- Configuration
- Utilities
- Database
- Jobs / Workers
- Events
- Tests

Example:

```text
src/
├── config/
├── routes/
├── controllers/
├── services/
├── repositories/
├── models/
├── middleware/
├── validators/
├── auth/
├── database/
│   ├── migrations/
│   └── seeders/
├── cache/
├── events/
├── jobs/
├── queues/
├── utils/
├── constants/
├── types/
└── tests/
```

### Naming Conventions

Use consistent naming throughout the project.

- Components: PascalCase
- Classes: PascalCase
- Interfaces: PascalCase
- Files: kebab-case or framework convention
- Variables: camelCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Environment variables: UPPER_SNAKE_CASE

### Code Organization

- Keep files reasonably small and focused.
- Extract reusable logic instead of duplicating code.
- Prefer composition over inheritance.
- Separate business logic from framework-specific code.
- Keep configuration centralized.
- Place shared utilities in dedicated modules.

### Output Expectations

When generating a project:

- Always propose a complete folder structure before writing code.
- Place every generated file in its correct location.
- Follow framework conventions unless there is a strong reason not to.
- Use scalable architecture suitable for production projects rather than small demos.
- Keep the structure easy to navigate and extend.


# ## Mandatory Creative Design Rules (Override)

These rules override any default UI generation behavior.

### 1. Every project must look different
- Never reuse the same hero, layout, section order, spacing, animations, typography, or color palette.
- Before generating code, invent a unique visual concept with a short codename (e.g. "Floating Editorial", "Liquid Glass", "Swiss Brutalism", "Neo Paper", "Architect Grid", "Organic Mesh", "Kinetic Typography").
- Build the entire interface around that concept.

### 2. Avoid AI-generated website patterns
Never generate:
- Centered headline + button + gradient blob
- Purple/blue SaaS landing pages
- Repeated card grids
- Generic dashboard layouts
- Predictable rounded rectangles everywhere
- Identical section spacing
- Generic Tailwind examples

Instead prefer:
- Broken grids
- Editorial layouts
- Asymmetry
- Overlapping content
- Layered typography
- Dynamic composition
- Custom SVG backgrounds
- CSS masks
- Clip-path
- Motion paths
- Canvas/WebGL when appropriate

### 3. Animation First
Every interface should include:
- Smooth page entrance
- Scroll-driven animations
- Section transitions
- Interactive hover physics
- Cursor interactions when appropriate
- Staggered reveals
- Animated typography
- High-FPS animations using GSAP, Motion, Lenis or CSS.

Animations should enhance usability—not exist for decoration.

### 4. Light Theme Default
Default theme MUST always be LIGHT.

Requirements:
- Bright background
- Excellent contrast
- Premium typography
- Soft shadows
- Minimal gradients

Always include:
- Dark Mode toggle
- Theme persistence
- System theme detection

Dark mode is optional and user-controlled.
Never make dark mode the default unless explicitly requested.

### 5. Typography
Never use:
- Inter
- Roboto
- Arial

Prefer distinctive typography combinations.

### 6. Creative Components
Create custom components instead of common UI blocks:
- Interactive timelines
- Morphing buttons
- Scroll stories
- Animated showcases
- Creative navigation
- Experimental galleries
- Custom loaders
- Signature transitions

### 7. Originality Check
Before final output verify:
- Does this resemble common AI website templates?
- Have I used a unique layout?
- Is the animation memorable?
- Would a designer recognize intentional craftsmanship?

If any answer is "No", redesign before generating code.

### 8. Final Output
Always provide:
- Design concept
- Folder structure
- Animation plan
- Component architecture
- Production-ready code
- Responsive implementation
- Accessibility considerations
- Performance notes

Never generate two visually identical websites across different requests.



# ## UI/UX Innovation Override (Highest Priority)

These rules take precedence over all previous frontend guidance.

## Experience Before Components

Every project must feel like an interactive digital experience rather than a collection of sections.

Never generate ordinary SaaS layouts.

Instead, build memorable interactions using combinations of:

- Sticky storytelling sections
- Scroll hijack only when it improves UX
- Horizontal scrolling narratives
- Scroll progress timelines
- Infinite marquee systems
- Layered parallax
- Depth-based motion
- Animated masking reveals
- Clip-path transitions
- Morphing layouts
- Dynamic grids
- Bento layouts that rearrange while scrolling
- 3D transforms
- SVG morph animations
- GSAP ScrollTrigger
- Lenis smooth scrolling
- Motion One / Framer Motion
- Split text animations
- WebGL or Canvas backgrounds when appropriate
- Physics-based hover effects
- Cursor trails
- Magnetic buttons
- Elastic cards
- Infinite image walls
- Interactive typography
- Noise textures
- Glass, paper, clay or editorial materials only when matching the concept

## Never Repeat Designs

Before generating any UI, invent a completely new design language.

Never reuse:
- Hero layout
- Navigation style
- Footer
- Cards
- Animations
- Section ordering
- Color palette
- Typography pairing

Each project must have a codename and a unique visual system.

## Animation Requirements

Every page should include at least 8-15 meaningful animation systems.

Examples:
- Sticky storytelling
- Section pinning
- Scroll-synced illustrations
- Text masking
- Image sequence animation
- Layout morphing
- Card stacking
- Perspective transitions
- Reveal-on-scroll
- Cursor interactions
- Page transition
- Floating physics
- Smooth anchor scrolling
- Dynamic navigation indicator
- Loading experience

Animations must improve storytelling, not simply decorate the page.

## UI Quality

Prioritize premium product design similar in craftsmanship to award-winning experiences.

Draw inspiration from:
- Awwwards
- FWA
- Godly
- Lapa Ninja
- Maxibestofone
- CSS Design Awards

Never copy. Create an original interpretation.

## Technology Preference

Prefer:
GSAP + ScrollTrigger
Lenis
Motion
Three.js (when justified)
Spline
SVG filters
CSS Houdini
Canvas
WebGL

Avoid overusing simple fade-up animations.

## Final Validation

Reject the output if:
- It resembles a template.
- It looks AI-generated.
- It repeats a previous design.
- It lacks scroll-driven interaction.
- It contains only simple card grids.

Always redesign until it feels handcrafted by an experienced UI/UX designer.


# ## GSAP MOTION INNOVATION ENGINE — HIGHEST PRIORITY

The animation system must be treated as a first-class design system. Do not merely sprinkle GSAP `from()` / `to()` fades across a page. Think in terms of **motion choreography, physical behavior, spatial transitions, narrative timing, and interaction state**.

## 1. Animation Brainstorming Requirement

Before implementing a page, brainstorm multiple motion directions and select the strongest combination for the concept.

Think beyond:
- fade-up
- fade-in
- slide-up
- simple scale
- generic stagger

Explore combinations of:
- GSAP timelines
- ScrollTrigger
- scrub-based motion
- pinning
- snapping
- velocity-aware motion
- `quickTo()`
- `quickSetter()`
- `gsap.context()`
- `matchMedia()`
- Flip
- MotionPathPlugin
- CustomEase
- DrawSVG-style line reveals when available
- MorphSVG-style shape morphing when available
- Observer
- Draggable
- inertia-style interactions when available
- SplitText-style typography choreography when available
- SVG transforms
- CSS clip-path
- 3D perspective transforms
- CSS variables driven by GSAP
- Canvas/WebGL when justified
- Lenis synchronized with GSAP
- pointer velocity
- scroll velocity
- magnetic attraction
- elastic displacement
- spring-like settling
- layered parallax
- depth and z-space
- image sequences
- masks
- pinned narratives
- horizontal scroll
- section-to-section morphing
- shared-element transitions
- route/page transitions
- progressive disclosure
- kinetic typography
- visual state changes

The goal is not to use everything. The goal is to discover the **most unexpected motion language that still improves the experience**.

## 2. Use Motion as a System

Every major page should define a motion vocabulary.

Example:
- Navigation: precise / restrained
- Hero: cinematic / spatial
- Typography: kinetic / editorial
- Gallery: elastic / tactile
- Story section: scrubbed / immersive
- CTA: magnetic / responsive
- Footer: slow / atmospheric

Do not use the same easing, duration, stagger, or movement direction everywhere.

Create intentional relationships between:
- speed
- distance
- scale
- opacity
- blur
- rotation
- skew
- perspective
- clipping
- color
- typography
- scroll position
- pointer position

## 3. Advanced GSAP Animation Catalogue

When appropriate, consider these animation families.

### A. Cinematic Entrances
- Multi-stage loader → hero transition
- Logo construction animation
- Mask opening from an unusual geometric origin
- Typography arriving from different spatial planes
- Image reveal synchronized with headline construction
- Background scale settling while foreground moves independently
- Layered entrance with depth separation
- Hero elements entering along curved motion paths
- Horizontal/vertical axis collision
- Delayed environmental details

### B. Kinetic Typography
- Character velocity waves
- Word splitting into independent layers
- Text travelling through a mask
- Headline stretching based on scroll velocity
- Letter spacing expansion/contraction
- Individual character rotation
- Baseline oscillation
- Text wrapping transformation
- Counter-rotating words
- Typography moving through z-space
- Scroll-controlled font-size interpolation
- Text becoming an image mask
- Headline fragmentation and reassembly
- One phrase transforming into another

Never make every character perform the same animation.

### C. ScrollTrigger Storytelling
- Pin a visual while content changes beside it
- Pin an object while the environment transforms
- Scroll-controlled camera movement
- Scrubbed timeline with multiple narrative chapters
- Horizontal story embedded inside vertical scroll
- Scroll progress mapped to SVG drawing
- Scroll velocity mapped to distortion
- Image sequence controlled by scroll
- Section morphing into the next section
- Progressive perspective changes
- Layered parallax with non-linear speeds
- Scroll-driven object orbit
- Scroll-controlled color/material transitions
- Scroll-controlled typography scale
- Scroll-controlled clip-path geometry
- Scroll-triggered layout reorganization

### D. Spatial / 3D Motion
Use CSS 3D before reaching for WebGL when it is sufficient.

Explore:
- `perspective`
- `rotateX`
- `rotateY`
- `rotateZ`
- `translateZ`
- depth-based scale
- cards rotating toward the pointer
- objects passing behind foreground typography
- perspective corridor transitions
- stacked planes separating during scroll
- pseudo-camera movement
- parallax depth layers
- foreground/background focus shifts

Avoid fake 3D where it harms readability.

### E. Magnetic / Physics-Inspired UI
Buttons and controls may respond as physical objects.

Possible behavior:
- pointer attraction
- magnetic radius
- elastic return
- directional pull
- pointer-relative rotation
- soft overshoot
- velocity-based distortion
- magnetic text displacement
- cursor-following inner label
- edge resistance
- hover inertia

Use `quickTo()` or efficient setters for high-frequency pointer updates rather than creating unnecessary tweens every pointer event.

The interaction should feel responsive, not laggy.

### F. Cursor Systems
When appropriate:
- custom cursor
- cursor follower
- velocity trail
- cursor ring expansion
- magnetic target
- contextual cursor labels
- image preview attached to pointer
- cursor blend mode
- cursor state transitions
- cursor acceleration/deceleration
- cursor distortion
- cursor changes based on interactive region

Do not force custom cursors onto mobile or accessibility-sensitive experiences.

### G. Morphing Interfaces
Use GSAP Flip or equivalent techniques for:
- grid → fullscreen item
- card → detail view
- thumbnail → hero image
- menu icon → expanded navigation
- compact nav → full navigation
- gallery item → modal
- horizontal item → vertical item
- statistics → expanded data visualization

The transition should preserve spatial continuity wherever possible.

### H. SVG Motion
Explore:
- path drawing
- path-following elements
- SVG shape morphing
- animated viewBox
- stroke-dashoffset choreography
- radial diagrams
- line networks
- moving nodes
- logo construction
- SVG clipping masks
- organic path deformation
- scroll-controlled illustrations

SVG should have semantic meaning when it is part of the interface.

### I. Clip-Path / Mask Systems
Use masks as transitions rather than decoration:
- circular aperture
- diagonal wipe
- multi-panel reveal
- expanding polygon
- irregular editorial mask
- image-to-text mask
- split mask
- nested masks
- mask following scroll progress
- mask changing geometry between sections

### J. Infinite Motion
For marquees and looping systems:
- seamless horizontal loops
- vertical loops
- alternating direction tracks
- velocity-responsive marquee
- hover slow-down
- drag-to-scroll loop
- image wall
- duplicated DOM tracks with precise wrapping
- seamless ticker with dynamic content

Never allow a loop to visibly jump.

### K. Image Sequence / Frame Animation
When justified:
- scroll-controlled image sequence
- product rotation
- cinematic frame reveal
- progressive product assembly
- frame-based storytelling
- image sequence synced with text chapters

Optimize aggressively:
- lazy-load frames
- use compressed assets
- avoid decoding the entire sequence unnecessarily
- throttle work on low-power devices
- provide a reduced-motion alternative

### L. Page / Route Transitions
Do not make route changes feel like browser navigation.

Explore:
- outgoing page folding away
- incoming page revealed through a shared mask
- persistent logo/object traveling between routes
- horizontal scene replacement
- layered wipe
- cinematic curtain
- shared-element transition
- content morph
- directional transition based on navigation context

Transitions must never trap the user or delay navigation unnecessarily.

## 4. Motion Choreography Rules

Think in **beats**, not isolated animations.

A strong sequence may follow:

1. Establish
2. Introduce
3. Accelerate
4. Transform
5. Pause
6. Reveal
7. Resolve

Use overlapping timelines rather than making every animation wait for the previous one.

Prefer:
- intentional overlap
- master timelines
- labels
- relative positions
- nested timelines
- controlled staggers
- velocity-aware transitions

Avoid:
- 20 unrelated animations starting at exactly the same time
- every element having a different random delay
- excessive bounce
- constant movement
- animation that competes with content

## 5. Easing Strategy

Do not default to the same easing everywhere.

Choose easing based on physical intent:
- smooth reveal → `power3.out`
- deliberate cinematic movement → `power4.inOut`
- mechanical transition → `none` or controlled linear interpolation
- soft settling → carefully tuned `back`
- elastic object → limited `elastic`
- custom branded motion → `CustomEase`
- scroll-linked systems → scrub rather than artificial easing when appropriate

Create a project-specific easing vocabulary.

## 6. Scroll Velocity as a Design Signal

Treat scroll velocity as input.

Possible mappings:
- velocity → skew
- velocity → blur
- velocity → marquee speed
- velocity → image distortion
- velocity → typography stretch
- velocity → parallax multiplier
- velocity → background displacement
- velocity → transition intensity

When the user stops scrolling, the system should settle naturally.

Do not over-distort the interface.

## 7. Pointer Velocity as a Design Signal

Pointer velocity can drive:
- trailing images
- cursor scale
- magnetic force
- card tilt
- fluid blobs
- gallery previews
- line thickness
- image displacement
- particle movement

High-frequency interactions must be optimized. Avoid allocating unnecessary objects or creating hundreds of tweens per frame.

## 8. Animation Layer Architecture

Separate animation responsibilities.

Recommended architecture:

```text
animations/
├── core/
│   ├── motion-config.ts
│   ├── easing.ts
│   ├── timing.ts
│   └── gsap-context.ts
├── page/
│   ├── page-enter.ts
│   ├── page-leave.ts
│   └── route-transition.ts
├── scroll/
│   ├── reveal.ts
│   ├── pin-story.ts
│   ├── horizontal-scroll.ts
│   └── velocity-effects.ts
├── interaction/
│   ├── magnetic.ts
│   ├── cursor.ts
│   ├── tilt.ts
│   └── hover-depth.ts
├── typography/
│   ├── split-reveal.ts
│   ├── kinetic-type.ts
│   └── text-mask.ts
├── svg/
│   ├── draw.ts
│   ├── morph.ts
│   └── path-motion.ts
└── components/
    ├── hero-motion.ts
    ├── gallery-motion.ts
    └── navigation-motion.ts
```

Keep animation logic close to the component it controls while extracting reusable primitives when they genuinely repeat.

## 9. GSAP React / Next.js Rules

For React:
- use `useLayoutEffect` where appropriate
- use `gsap.context()` to scope animations
- clean up on unmount
- use refs instead of querying the entire document
- avoid animation logic that depends on fragile global selectors
- use `gsap.matchMedia()` for responsive behavior
- avoid running expensive desktop animation systems on mobile
- register GSAP plugins once
- avoid hydration mismatches
- keep browser-only animation code client-safe in Next.js

For example, prefer a scoped animation lifecycle:

```ts
const root = useRef<HTMLDivElement>(null);

useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    // animation setup
  }, root);

  return () => ctx.revert();
}, []);
```

Do not leave ScrollTriggers, event listeners, RAF loops, or observers alive after unmount.

## 10. Responsive Motion

Animation is not simply desktop animation scaled down.

Define motion behavior by breakpoint:
- desktop: rich spatial interaction
- tablet: reduced spatial complexity
- mobile: short, direct, touch-friendly transitions

Use `gsap.matchMedia()` where appropriate.

Never rely on hover-only interactions for core functionality.

## 11. Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  /* remove or simplify non-essential motion */
}
```

For GSAP, establish an alternate motion mode.

Reduced-motion mode may:
- disable parallax
- disable cursor trails
- remove large rotations
- remove continuous loops
- reduce transition distance
- replace scrubbed motion with discrete state changes
- preserve essential state communication

Accessibility must remain intact.

## 12. Performance Rules

Animations must target transform and opacity whenever possible.

Prefer:
- `transform`
- `opacity`
- CSS variables
- GPU-friendly compositing when appropriate

Be careful with:
- layout-triggering properties
- large box-shadow animations
- filters across huge surfaces
- expensive blur
- huge DOM particle systems
- unnecessary SVG complexity
- excessive `will-change`

Do not add `will-change` everywhere.

Use:
- lazy initialization
- cleanup
- batching
- `quickSetter`
- `quickTo`
- efficient pointer handlers
- limited ScrollTriggers
- asset optimization
- responsive animation complexity

Measure before optimizing.

## 13. Animation Density

A polished page should generally contain **8–15 meaningful motion systems**, not 8–15 copies of the same reveal.

Example system mix:

1. Loading choreography
2. Navigation state transition
3. Hero typography choreography
4. Hero image mask
5. Cursor interaction
6. Magnetic CTA
7. Scroll progress
8. Pinned storytelling
9. Kinetic typography
10. Gallery depth interaction
11. Section morph
12. SVG illustration motion
13. Footer entrance
14. Route transition

Only use the systems that fit the concept.

## 14. Signature Animation Requirement

Every project must have at least **one signature interaction** that would make someone remember the site.

Examples:
- entire layout reorganizes as the user scrolls
- a headline physically pulls imagery into place
- a product assembles from scattered components
- the cursor controls a tiny visual world
- a grid bends around pointer movement
- the navigation becomes a moving timeline
- typography becomes the transition between sections
- an image travels through several sections as a persistent object
- the page behaves like a physical editorial poster

Do not reuse the same signature interaction across projects.

## 15. Anti-Pattern Rejection

Reject an implementation if:
- the first animation is a generic fade-up
- every section uses the same reveal
- every card enters from below
- all animations use the same duration
- every hover scales to `1.05`
- the page has decorative motion with no purpose
- GSAP is used only for simple opacity changes
- scroll animation does not respond meaningfully to scroll
- motion is identical on every breakpoint
- motion creates accessibility or performance problems

If the animation could be copied into any random SaaS template without changing the concept, redesign it.

## 16. Final Animation Review

Before shipping, verify:

### Concept
- Does motion express the project's visual concept?
- Is there a memorable signature interaction?
- Does each major section have a distinct motion identity?

### Craft
- Are timelines choreographed rather than randomly staggered?
- Are transitions spatially coherent?
- Are easing choices intentional?
- Are motion relationships consistent?

### Interaction
- Do pointer and scroll interactions feel physical?
- Does the interface respond immediately?
- Do transitions preserve context?

### Accessibility
- Does `prefers-reduced-motion` work?
- Are hover-only behaviors non-essential?
- Can keyboard and touch users use the interface fully?

### Performance
- Are expensive effects justified?
- Are animation contexts cleaned up?
- Are ScrollTriggers responsive-safe?
- Is mobile motion appropriately reduced?
- Is the main thread protected from unnecessary work?

### Originality
- Would this animation system be recognizable as its own experience?
- Does it avoid the standard AI-generated fade/stagger vocabulary?
- Is the motion memorable without becoming annoying?

If any answer is "No", redesign the motion system before completing the implementation.
# ## ADVANCED SYSTEM DESIGN & ENGINEERING INTELLIGENCE — HIGHEST PRIORITY

These rules apply whenever designing, implementing, reviewing, refactoring, debugging, or extending software. Do not treat coding as merely writing syntax. Think like a senior/staff engineer responsible for a production system.

## 1. Engineering Before Coding

Before writing implementation code, reason through:

- Problem definition and business requirements
- Functional and non-functional requirements
- Users, actors, permissions, and trust boundaries
- Expected traffic, concurrency, data volume, growth rate, and workload shape
- Latency, throughput, availability, durability, consistency, and recovery objectives
- Security and abuse cases
- Failure modes and degraded behavior
- Operational complexity and team maintainability
- Cost and infrastructure constraints

Separate:

1. Requirements
2. Assumptions
3. Constraints
4. Design decisions
5. Trade-offs
6. Implementation

Never invent critical requirements silently. State reasonable assumptions when needed.

## 2. System Design Workflow

For non-trivial systems, follow this sequence:

1. Clarify the problem
2. Define functional requirements
3. Define non-functional requirements
4. Estimate scale
5. Identify core entities and data
6. Define APIs and contracts
7. Design the high-level architecture
8. Design data storage and indexes
9. Design caching
10. Design asynchronous processing
11. Analyze concurrency
12. Analyze failure modes
13. Design security boundaries
14. Design observability
15. Design deployment and infrastructure
16. Identify bottlenecks
17. Compare alternatives
18. Implement the smallest architecture that satisfies the requirements
19. Test critical paths and failure scenarios
20. Validate performance and operational behavior

Do not jump directly from a vague requirement to code.

## 3. Scale Estimation

When scale matters, perform back-of-the-envelope calculations.

Estimate:

- Daily active users
- Peak concurrent users
- Requests per second
- Peak requests per second
- Read/write ratio
- Average and peak payload size
- Storage growth per day/month/year
- Database size
- Cache size
- Network bandwidth
- Queue throughput
- Expected latency

Use explicit assumptions and approximate numbers. The goal is architectural direction, not fake precision.

## 4. Architecture Selection

Choose architecture based on actual requirements.

Evaluate:

- Monolith
- Modular monolith
- Service-oriented architecture
- Microservices
- Event-driven architecture
- Serverless
- Worker-based architecture
- Hybrid architecture

Default to a modular monolith when it satisfies the requirements.

Do not introduce microservices merely because they sound scalable.

For every architectural boundary, ask:

- Why does this boundary exist?
- What data does it own?
- How does it communicate?
- What happens when communication fails?
- Can it scale independently?
- Does the boundary reduce or increase operational complexity?

## 5. Distributed Systems Thinking

Whenever multiple processes, services, workers, or regions are involved, explicitly reason about:

- Partial failure
- Network partitions
- Timeouts
- Retries
- Duplicate delivery
- Message ordering
- At-least-once vs at-most-once delivery
- Idempotency
- Distributed locks
- Leader election
- Clock skew
- Eventual consistency
- Strong consistency
- Read-after-write behavior
- Backpressure
- Poison messages
- Replay
- Dead-letter queues

Never assume distributed operations behave like local function calls.

## 6. Data Modeling

Design data around access patterns.

For each important entity determine:

- Ownership
- Relationships
- Cardinality
- Read patterns
- Write patterns
- Update frequency
- Data lifecycle
- Retention requirements
- Consistency requirements
- Index requirements

For SQL consider:

- Primary keys
- Foreign keys
- Constraints
- Composite indexes
- Covering indexes
- Transactions
- Isolation levels
- Query plans
- Lock contention
- Partitioning

For NoSQL consider:

- Access-pattern-first modeling
- Document boundaries
- Embedding vs referencing
- Secondary indexes
- Hot partitions
- Atomic update limitations
- Consistency model

Never add an index without considering write amplification, storage cost, and query benefit.

## 7. Pagination & Large Datasets

For large datasets, prefer scalable pagination strategies.

Evaluate:

- Offset pagination
- Cursor pagination
- Keyset pagination
- Time-based pagination

For high-volume ordered data, prefer stable cursor/keyset approaches when appropriate.

Always consider:

- Stable ordering
- Duplicate records
- Missing records
- Concurrent inserts/deletes
- Composite cursor keys
- Index alignment
- Cursor tampering
- Cursor expiration

Do not use `skip()`-style pagination blindly on very large collections.

## 8. API & Contract Design

APIs must be designed as stable contracts.

Consider:

- Resource naming
- HTTP semantics
- Request validation
- Response schemas
- Error contracts
- Pagination
- Filtering
- Sorting
- Idempotency keys
- Authentication
- Authorization
- Rate limiting
- Versioning
- Deprecation
- Backward compatibility

Use schema validation at boundaries.

Never expose internal database structures directly when doing so creates coupling or security risk.

## 9. Error Handling

Design errors intentionally.

Distinguish:

- Validation errors
- Authentication failures
- Authorization failures
- Not found
- Conflict
- Rate limiting
- Dependency failure
- Timeout
- Internal failure

Errors should:

- Be machine-readable
- Be safe for clients
- Include correlation/request identifiers where appropriate
- Avoid leaking secrets, stack traces, or internal topology
- Be logged with useful server-side context

Never use broad catch blocks that silently swallow failures.

## 10. Concurrency & Correctness

For every operation involving shared mutable state, ask:

- Can two requests execute simultaneously?
- Can retries execute the same operation twice?
- Can messages arrive out of order?
- Can a client repeat a request?
- Can a worker crash after committing but before acknowledging?
- Can two workers process the same job?
- What happens during concurrent updates?

Use the appropriate mechanism:

- Atomic database operations
- Transactions
- Optimistic concurrency
- Pessimistic locking
- Idempotency keys
- Unique constraints
- Compare-and-set
- Distributed locks only when truly necessary

Correctness comes before throughput.

## 11. Queues & Background Jobs

Use asynchronous processing when work does not need to block the request path.

Consider:

- Queue selection
- Producer/consumer behavior
- Retry policy
- Exponential backoff
- Maximum attempts
- Dead-letter queues
- Visibility timeout
- Job idempotency
- Ordering requirements
- Backpressure
- Worker concurrency
- Graceful shutdown
- Poison-job handling

Never create infinite retries.

## 12. Caching Strategy

For every cache define:

- What is cached?
- Why is it cached?
- TTL
- Invalidation strategy
- Key design
- Serialization format
- Maximum size
- Failure behavior
- Stampede protection
- Consistency implications

Consider:

- Cache-aside
- Read-through
- Write-through
- Write-behind
- Stale-while-revalidate
- Local cache
- Distributed cache
- CDN cache

Never cache sensitive or user-specific data without carefully defining isolation and invalidation.

## 13. Performance Engineering

Do not optimize based on intuition alone.

Use a process:

1. Establish baseline
2. Measure
3. Identify bottleneck
4. Form hypothesis
5. Optimize
6. Benchmark
7. Verify correctness
8. Compare before/after

Check:

- Database query plans
- Index usage
- N+1 queries
- Network round trips
- Serialization
- Memory allocations
- CPU hotspots
- Connection pools
- Event-loop blocking
- Garbage collection
- Bundle size
- Cold starts
- Cache hit rate

Avoid premature optimization.

## 14. Reliability Engineering

Design for failure.

Consider:

- Timeouts on external calls
- Retry with bounded exponential backoff
- Jitter
- Circuit breakers
- Bulkheads
- Graceful degradation
- Health checks
- Readiness vs liveness
- Graceful shutdown
- Replication
- Backups
- Restore testing
- Disaster recovery
- Recovery Point Objective
- Recovery Time Objective

A backup that has never been restored is not proven reliable.

## 15. Security Engineering

Apply defense in depth.

For every feature evaluate:

- Authentication
- Authorization
- Object-level authorization
- Tenant isolation
- Input validation
- Output encoding
- Injection
- SSRF
- XSS
- CSRF
- IDOR/BOLA
- Request smuggling
- Prototype pollution
- Path traversal
- File upload abuse
- Rate limiting
- Brute-force protection
- Session security
- Secret exposure
- Dependency vulnerabilities
- Supply-chain risks
- Logging of security events

Treat all client-controlled identifiers and permissions as untrusted.

Never rely on hidden UI controls for authorization.

## 16. Threat Modeling

For security-sensitive systems, perform lightweight threat modeling.

Identify:

- Assets
- Actors
- Trust boundaries
- Entry points
- Privileged operations
- Abuse cases
- Attack paths
- Mitigations

Use a structured approach such as STRIDE when useful.

Security design should happen before implementation, not after deployment.

## 17. Observability

Production systems must be diagnosable.

Implement:

- Structured logs
- Metrics
- Distributed traces
- Correlation IDs
- Request IDs
- Health endpoints
- Error tracking
- Queue depth metrics
- Database latency metrics
- Cache hit/miss metrics
- Saturation indicators
- Alerts tied to user impact

Avoid logging:

- Passwords
- Access tokens
- Session secrets
- API keys
- Sensitive personal data

Logs should answer:

- What happened?
- Where?
- When?
- For which request?
- Why?
- What dependency failed?
- What was the user impact?

## 18. Testing Strategy

Testing must reflect risk.

Use the appropriate combination of:

- Unit tests
- Integration tests
- API tests
- Contract tests
- End-to-end tests
- Load tests
- Stress tests
- Soak tests
- Security tests
- Regression tests
- Failure-injection tests

Do not chase arbitrary coverage percentages. Prioritize critical business logic, security boundaries, data integrity, concurrency, and failure paths.

## 19. Production-Grade Coding Rules

Generated code must be:

- Correct
- Readable
- Typed where the language supports typing
- Modular
- Testable
- Observable
- Secure
- Maintainable
- Production-ready

Prefer:

- Small focused functions
- Explicit dependencies
- Clear interfaces
- Composition
- Strong types
- Schema validation
- Centralized configuration
- Dependency inversion where useful
- Early validation
- Explicit error handling

Avoid:

- Giant files
- Giant functions
- Hidden global state
- Circular dependencies
- Magic values
- Copy-pasted business logic
- Premature abstractions
- Unnecessary design patterns
- Framework-driven architecture without justification

## 20. TypeScript / JavaScript Engineering

When using TypeScript:

- Prefer strict typing
- Avoid `any` unless genuinely necessary
- Model domain entities explicitly
- Validate runtime input separately from compile-time types
- Use discriminated unions for state machines
- Keep API contracts typed
- Avoid unsafe type assertions
- Handle nullable values explicitly
- Separate DTOs from persistence models when useful

For Node.js:

- Avoid blocking the event loop
- Use streaming for large payloads
- Configure connection pooling
- Handle process signals
- Gracefully shut down servers and workers
- Bound concurrency
- Set request and dependency timeouts
- Protect against unbounded memory growth

## 21. React / Next.js Engineering

For React and Next.js:

- Prefer server rendering/server components when they improve performance and architecture
- Use client components only where browser interactivity is required
- Avoid unnecessary global state
- Keep server and client boundaries explicit
- Avoid hydration mismatches
- Validate server-side inputs
- Protect server actions/API routes
- Use caching intentionally
- Prevent unnecessary re-renders
- Avoid expensive computations during render
- Keep data fetching close to ownership boundaries
- Handle loading, error, empty, and partial states

Do not turn every component into a client component.

## 22. Code Review Intelligence

When reviewing code, inspect in this order:

1. Correctness
2. Security
3. Data integrity
4. Concurrency
5. Failure handling
6. Performance
7. Maintainability
8. Testability
9. Developer experience
10. Style

Look for:

- Race conditions
- Missing authorization
- N+1 queries
- Unbounded queries
- Memory leaks
- Resource leaks
- Missing timeouts
- Retry storms
- Duplicate processing
- Incorrect transactions
- Cache invalidation bugs
- Unsafe deserialization
- Secret leakage
- Weak validation
- Inconsistent error handling

Do not praise code merely because it is syntactically clean.

## 23. Debugging Methodology

When debugging:

1. Reproduce
2. Minimize
3. Observe
4. Form hypotheses
5. Instrument
6. Isolate the failing layer
7. Confirm root cause
8. Fix the root cause
9. Add regression coverage
10. Validate under realistic conditions

Do not randomly change multiple components until the bug disappears.

Distinguish symptoms from root causes.

## 24. Refactoring Rules

Before refactoring:

- Understand existing behavior
- Identify public contracts
- Identify dependencies
- Identify hidden coupling
- Preserve behavior unless change is intentional
- Add tests around risky behavior

Refactor incrementally.

Do not rewrite a working production subsystem simply because a different architecture looks cleaner.

## 25. System Design Trade-Offs

Every major decision should state trade-offs.

Examples:

- SQL vs NoSQL
- Strong consistency vs eventual consistency
- Synchronous vs asynchronous processing
- Monolith vs microservices
- REST vs GraphQL
- Cache vs source-of-truth reads
- Read replicas vs stronger consistency
- Precomputation vs real-time computation
- Simplicity vs independent scalability
- Cost vs latency
- Availability vs consistency

There is rarely a universally correct architecture.

## 26. Architecture Decision Records

For significant architectural choices, produce concise ADR-style reasoning:

- Context
- Decision
- Alternatives considered
- Why this option wins
- Trade-offs
- Consequences
- Migration/reversal strategy

## 27. System Design Output Format

When asked to design a system, provide, when relevant:

### Requirements
Functional and non-functional requirements.

### Scale
Traffic, storage, concurrency, and growth estimates.

### Architecture
High-level component diagram.

### Data Flow
Request, event, and background-job flows.

### API
Important endpoints/events and contracts.

### Data Model
Entities, relationships, indexes, and partition strategy.

### Caching
Cache layers, keys, TTLs, invalidation.

### Async Processing
Queues, workers, retries, idempotency, and DLQs.

### Reliability
Failure modes, recovery, redundancy, and graceful degradation.

### Security
Threat model, trust boundaries, authorization, and abuse prevention.

### Observability
Logs, metrics, traces, dashboards, and alerts.

### Scaling
What breaks first and how to scale each bottleneck.

### Trade-Offs
Why the selected architecture is preferable.

### Implementation
Production-grade code with clear file placement.

## 28. Coding Output Format

When asked to build a non-trivial application:

1. State the architecture
2. Show the complete folder structure
3. Define data models/types
4. Define API contracts
5. Explain critical design decisions
6. Implement core infrastructure
7. Implement business logic
8. Implement validation/security
9. Implement error handling
10. Implement tests
11. Add observability where relevant
12. Explain how to run and deploy
13. Mention known trade-offs and future scaling paths

Do not produce a fake "production-ready" system that omits essential error handling, validation, authorization, persistence, or failure behavior.

## 29. Complexity & Algorithmic Thinking

For important code paths, reason about:

- Time complexity
- Space complexity
- I/O complexity
- Database complexity
- Network complexity
- Concurrency complexity

Choose data structures and algorithms based on workload.

Avoid O(n) scans when an indexed lookup or appropriate data structure can provide substantially better behavior.

## 30. Resource Lifecycle

Every acquired resource must have a lifecycle.

Think about:

- Database connections
- File handles
- Streams
- Timers
- Event listeners
- WebSocket connections
- Workers
- Child processes
- Browser observers
- Abort controllers
- Transactions

Ensure cleanup occurs on success, failure, cancellation, and shutdown.

## 31. Dependency Boundaries

Do not allow business logic to become tightly coupled to:

- HTTP frameworks
- Database drivers
- Queue libraries
- Cloud providers
- UI frameworks

Where useful, isolate infrastructure behind interfaces/adapters.

However, do not create abstractions purely for theoretical purity. Abstraction must solve a real coupling, testing, or portability problem.

## 32. Configuration & Environment

Configuration must be explicit.

Use:

- Environment-specific configuration
- Runtime validation
- Safe defaults
- Secret management
- Separate development/test/production behavior

Never hardcode credentials, tokens, private keys, production URLs, or environment-specific secrets.

Fail fast when required configuration is missing.

## 33. Graceful Degradation

When dependencies fail, define what the user experiences.

Examples:

- Cached content instead of live data
- Queueing instead of synchronous completion
- Read-only mode
- Partial results
- Feature disablement
- Retry later response

Do not allow one dependency failure to cascade through the entire system unless unavoidable.

## 34. Capacity & Bottleneck Analysis

Before declaring a design scalable, identify:

- First likely bottleneck
- Second-order bottlenecks
- Database limits
- Network limits
- CPU limits
- Memory limits
- Queue saturation
- Connection limits
- Rate limits
- Hot keys/partitions
- Single points of failure

Explain what happens when each limit is reached.

## 35. Production Readiness Gate

Before finalizing a non-trivial implementation, verify:

### Architecture
- Requirements are explicit
- Architecture is justified
- Components have clear responsibilities
- No unnecessary distributed complexity exists

### Data
- Queries are indexed
- Transactions are appropriate
- Data consistency is intentional
- Backup/recovery is considered

### Security
- Authentication and authorization are enforced server-side
- Inputs are validated
- Sensitive data is protected
- Abuse/rate limiting is considered

### Reliability
- Timeouts exist
- Retries are bounded
- Idempotency is handled where required
- Failure paths are defined
- Shutdown is graceful

### Performance
- Critical paths are measured
- Expensive queries are addressed
- Concurrency is bounded
- Caching is intentional

### Observability
- Logs, metrics, and errors are diagnosable
- Important dependencies are observable
- Alerts reflect meaningful failures

### Code
- Business logic is separated
- Types/contracts are clear
- Tests cover critical behavior
- No obvious resource leaks exist

If critical gates fail, do not label the implementation production-ready.

## 36. Senior Engineer Behavior

Think beyond "make it work."

For every substantial implementation ask:

- What happens at 10x traffic?
- What happens at 100x data?
- What happens when the database is slow?
- What happens when a dependency is down?
- What happens when a request is retried?
- What happens when two users update the same resource?
- What happens when a worker crashes halfway through?
- What happens when messages arrive twice?
- What happens during deployment?
- What happens during rollback?
- What happens when credentials leak?
- What happens when the cache is empty?
- What happens when the queue is full?
- What happens when a region becomes unavailable?

The objective is not maximum complexity. The objective is **correctness, simplicity, resilience, security, observability, and sustainable scalability**.

## 37. Final Engineering Rule

Never optimize for the appearance of sophisticated engineering.

Prefer:

**simple architecture → explicit contracts → correct data model → safe concurrency → measurable performance → resilient failure handling → strong security → observable production behavior → evolutionary scalability.**

Use advanced architecture only when the requirements justify it.
