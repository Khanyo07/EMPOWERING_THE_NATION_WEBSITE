# Empowering the Nation — Website

Website for **Empowering the Nation**, Precious Radebe's skills training business in Johannesburg (XHAW5112, Task 3).

- **Live site:** https://khanyo07.github.io/Empowering-the-nation/
- **Mobile application:** https://github.com/Khanyo07/Empowering-the-nation-a.p.p
- **Figma wireframes:** https://www.figma.com/design/r53EMOYF3Y9owyNzM1iMGY/Empowering-the-Nation---Wireframes?node-id=0-1&t=sbfjbmtnG8hwKDas-1
- **Video links:** none (no YouTube videos were produced for this project)

Student: Lukhanyo Kuhle Letsatsi Molefe (ST10529501) · Lecturer: Helena Nortje

## Pages
| File | Page |
| --- | --- |
| index.html | Home |
| about.html | About Us |
| courses.html | Course overview (search, filter, comparison table) |
| course-*.html | Seven individual course pages |
| fees.html | Calculate fees (discount + 15% VAT, quote table) |
| contact.html | Contact Us (enquiry form, map, branch table) |
| 404.html | Page not found |

## Features
- Drop-down **Courses** menu listing all seven courses and fees
- Live fee calculator: 2 courses 5%, 3 courses 10%, more than 3 courses 15%, then 15% VAT
- Form validation and error messages on the fee and contact forms
- Tables: course comparison, discount rules, quote breakdown, branch details
- Responsive layout down to phone width

## Accessibility (WCAG 2.2 AA)
Tested with axe-core 4.10 on every page and form state (0 violations), plus keyboard, zoom and screen-reader checks.

- Colour contrast: all text at least 4.5:1; form borders and focus rings at least 3:1 (darker gold and teal used for text)
- Keyboard: skip link, visible focus ring on every control, drop-down and menu work with Tab, Enter and Escape
- Focus never hidden under the sticky header or bottom navigation
- Forms: labelled fields, required fields stated, an error summary that links to each problem, errors announced to screen readers
- Fee totals announced when a course is ticked; tables have captions and scroll by keyboard
- Works at 320 px wide, 200% zoom and with increased text spacing; supports Windows High Contrast and reduced motion

## Structure
`base.css` shared brand styles · `site.css` website layout · `app.js` all behaviour.

## Publishing
GitHub Pages: Settings › Pages › Deploy from a branch › `main` / root.
