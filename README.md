# Kitty Planner Studio
#### Video Demo: https://www.youtube.com/watch?v=e13jxpgL-Kw
#### Description:
 and if you debated certain design choices, explaining why you made them.
## Project Overview:
This project is a web-based application using the Flask framework with Python, JavaScript, and SQL. It serves as a dynamic tool to assist users in creating plans, managing schedules, setting goals, and keeping track of their daily consumption, whether it be expenses, nutrition, or other aspects. The aim is to provide a comprehensive solution for organizing and optimizing various aspects of users' lives, centered around three core components:

1. **Todo List:**
   - A simple way to view tasks and categorize them.

2. **Time Table:**
   - Customized schedules tailored to individual needs.

3. **Calculator:**
   - Utilized for tasks like budget planning and calories consumption tracking.

## Technology Stack and Project Structure (Flask framework): 📁

### Client Side (HTML, CSS, JavaScript):

#### Templates:
- `layout.html`: Layout for other templates, including navigation links.
- `index.html`: Main page template.
- `login.html`: Login/register form template.
- `browse.html`: A simple view for all tables the user has.
- `create.html`: Create table form.
- `events.html`: A simple view for all events the user has.
- `todo.html`: Todo List component template.
- `table.html`: Time Table component template.
- `calc.html`: Calculator component template.
- `preferences.html`: A list of backgrounds and themes to choose from.

#### Static Files:
- **Images:**
  - `kitty.png`: Project logo.
  - `backgrounds`: Background images for users to choose from.
  - `icons`: All icons used in the project for buttons and others.
  - `gifs`: The kitty gifs used for tutorials and help.

- **Scripts Folder:**
  - `script.js`: JavaScript logic for commonly used functions (add - edit - delete - toggle - link - load).
  - `layout_script.js`: JavaScript logic for functions used to complete the layout (Generate_calendar - set_backgrounds - set_theme).
  - `tutorial_script.js`: JavaScript logic for playing the tutorial.

- `styles.css`: Global stylesheet for the entire application.

### Server Side (Python, SQLite3):

#### Main Files:
- `app.py`: Main Flask application file handling routing and logic.
- `helpers.py`: Additional Python file containing helper functions.
- `tables.db`: SQLite3 database file storing application data, including the following tables:
    - `users`: Store user data.
    - `list_tables`: Store tables for each user.
    - `categories`: Categories for each table of the three tables.
    - `periods`: Store categories start and end time for timetables.
    - `list_items`: Store all items for todo-lists, alarms, and timetables.
    - `table_events`: Store the events and alarm information.
    - `items_value`: Store all items and their value previously added in the calculator to call again when mapping.
    - `items_mapping`: Store calculator items data for each day.
    - `goals`: Store the values needed to measure goals, mainly for calculators.
    - `imported_values`: Include the calculator's values that are imported from another calculator.
    - `links`: Store links between tables and items.
    - `progress`: Store the progress for each table and item per day.
    - `templates`: Templates data and order for a tutorial tour.
    - `page_messages`: The tutorial messages for each template.

### Key Features 🚀:

1. *User Authentication:*
    Ensure secure access with user authentication, allowing users to create accounts, log in, and personalize their experience.

2. *Adding, Editing, and Deleting:*
   Effortlessly manage your inputs with intuitive interfaces. Easily add tasks, edit details, or delete items with a simple and user-friendly process.

3.  **Browse:**
    Effortlessly explore all created tables or focus on a specific type with an easy-to-use browsing feature.

4. Todo List:
    Seamlessly manage tasks and prioritize to-do items, enhancing productivity through the organization of daily, weekly, , monthly or customize their own period of time for each list , set goals, alarms, and reminders for important events, track progress throughout the days, and categorize items to gain a comprehensive overview of your to-do list.

5. **Time Table:**
    shares similar features with the Todo List, treating every inserted item as an alarm to keep user on schedule. Create customized schedules, efficiently managing time for classes, study sessions, and extracurricular activities.

6. **Calculator:**
   facilitates tasks like budget planning and calories consumption tracking, Make informed decisions with accessible tools for everyday calculations.  Visualize insights through charts displaying averages and totals over chosen periods, be it days, weeks, months or everything.

7.  **Linking:**
    Enhance organization by linking between different tables, creating a cohesive structure. Build joint tables with main events and additional details for a simplified and efficient process.

8. **Main table:**
    A centralized table on the user homepage, displaying all upcoming events yet to be completed for your chosen period, set by default to a week.


9.  **progress tracking:**
    Easily monitor your progress with intuitive progress bars for each table and overall progress view. The system records and displays historical progress for each day, including the status of items on that specific day.providing valuable insights into the user journey.

10. **Notifications:**
    Stay informed with a preview of important items and upcoming events on your home page. Receive timely alerts and notifications to ensure you never miss a deadline or task.

11. **Auto Update Items Data:**
    The system automatically updates and resets for item status, alarms, and tables. Maintain data accuracy by ensuring timely updates and resets after exceeding end dates.

12. **User-Friendly Interface and Customization Options:**
    Navigate the application effortlessly with an intuitive and visually appealing design. Personalize the application to fit unique preferences and requirements, including the ability to personalize backgrounds, themes, or preferences.

13. **toutoria tour:**
    A comprehensive tutorial tour guides users through all pages and features of the project, providing both a full tour explanation and a quick single page tutorial for each page.


14. **kitty:**
    Meet your adorable mascot, always ready to assist. Find Kitty sleeping in the navigation bar, offering reminders for alarms and almost-ending tables. Kitty is there to guide you with tutorials and add a touch of charm to your journey.

This collection of features aims to create a holistic and user-centric experience, addressing various aspects of organization and productivity.

