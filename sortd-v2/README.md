# Hailstone Strata

## Full Stack Ecommerce Framework

Built with Django, PostgreSQL, Next.js, TypeScript, Tailwind CSS, and Stripe

---

## Overview

Hailstone Strata is a modern full stack ecommerce framework designed and developed to explore scalable commerce architecture using a decoupled frontend and backend approach.

The project combines a Django REST API backend with a Next.js storefront frontend to create a performant and highly customisable ecommerce platform. The aim was to move beyond template-based ecommerce systems and instead build a flexible foundation capable of supporting bespoke business workflows and modern user experiences.

This project was built as part of my transition into software development and demonstrates full stack application architecture, API integration, state management, payment processing, deployment workflows, and reusable component design.

---

## Key Features

### Backend

- Django REST Framework API
- PostgreSQL database integration
- Modular app architecture
- Product and category management
- Product image support
- Order and order item models
- Cart validation endpoints
- Stripe Checkout integration
- Stripe webhook handling
- Django admin customisation

### Frontend

- Next.js App Router architecture
- Responsive ecommerce storefront
- Product listing and detail pages
- Category filtering
- Search functionality
- Zustand cart state management
- Persistent cart using localStorage
- Reusable layout and UI components
- Stripe checkout flow integration

---

## Technical Stack

| Area             | Technology                    |
| ---------------- | ----------------------------- |
| Frontend         | Next.js, React, TypeScript    |
| Styling          | Tailwind CSS                  |
| State Management | Zustand                       |
| Backend          | Django, Django REST Framework |
| Database         | PostgreSQL                    |
| Payments         | Stripe Checkout + Webhooks    |
| Deployment       | Vercel + Render               |
| Version Control  | Git + GitHub                  |

---

## What This Project Demonstrates

This project demonstrates practical experience with:

- Building REST APIs using Django REST Framework
- Structuring scalable full stack applications
- Working with relational databases
- Managing frontend application state
- Integrating third-party payment providers
- Handling asynchronous webhook events
- Building reusable React components
- Connecting frontend and backend systems
- Debugging deployment and production issues
- Working with modern deployment pipelines

---

## Architecture

The application uses a decoupled architecture:

- The Django backend exposes API endpoints for products, categories, cart validation, and orders
- The Next.js frontend consumes these APIs and handles the storefront experience
- Stripe handles secure payment processing and checkout
- Zustand manages cart state client-side

This separation allows the frontend and backend to scale independently and provides flexibility for future expansion into mobile apps, dashboards, or alternative storefronts.

---

## Project Structure

```bash
strata/
├── backend/
│   ├── products/
│   ├── categories/
│   ├── orders/
│   ├── customers/
│   ├── payments/
│   ├── shipping/
│   └── manage.py
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── store/
│   ├── lib/
│   └── package.json
│
└── README.md
```

---

## Challenges & Learning Outcomes

Some of the key areas explored while building this project included:

- Connecting a Next.js frontend to a Django backend
- Handling CORS and API communication
- Managing image delivery between services
- Stripe payment flow integration
- Persisting client-side cart state
- Designing reusable frontend layouts
- Structuring scalable backend apps
- Debugging deployment issues across Vercel and Render
- Working with environment variables and production configuration

This project significantly improved my understanding of modern web application architecture and gave me hands-on experience working across the full stack.

---

## Future Improvements

Planned future features include:

- User authentication
- Customer accounts
- Wishlist functionality
- Product reviews
- Inventory management
- Discount codes
- Admin analytics dashboard
- Shipping integrations
- CMS/blog functionality
- Advanced search and filtering

---

## About Me

I currently work as a BI Analyst with a background in finance systems, reporting, SQL, and process optimisation. Alongside my data and analytics work, I’ve been actively developing my software engineering skills through full stack projects like Hailstone Strata.

This project reflects both my technical curiosity and my interest in building systems that are scalable, maintainable, and genuinely useful.

---

## Contact

GitHub: https://github.com/tambrulee  
Portfolio: https://yourportfolio.com  
LinkedIn: https://linkedin.com/in/tamsin-te-strote/

---

## License

This project is currently private and intended for portfolio and educational purposes.
