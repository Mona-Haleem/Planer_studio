import os
from cs50 import SQL
from flask import Flask, flash, redirect,get_flashed_messages, render_template, request, session, jsonify, url_for
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
import re
from dateutil.relativedelta import relativedelta
from datetime import datetime, timedelta
import helpers
from helpers import login_required


# Configure application
app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

db = SQL("sqlite:///tables.db")

#global varibles
durations =[{'daily':'1'}, {'weekly':'7'}, {'monthly':'30'}, {'once':'0'},{'custom':'temp'}]
main_periods = db.execute("SELECT * FROM periods WHERE table_id = 2")

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

#send data to layout
@app.context_processor
def inject_data():
    if 'date' in session:
        session_date=session['date']
        user_id = session['user_id']
        print('inject',session_date)
        today = datetime.today().date()
        alarms = db.execute("SELECT table_events.*, list_items.item FROM table_events JOIN list_items ON table_events.item_id = list_items.id where date = ? and alarm = 1 and user_id = ? ORDER BY timer ",today,session['user_id'])
        success_message = get_flashed_messages(category_filter=['success'])
        if  success_message :
            end_tables = helpers.get_end_tables(session['user_id'])
            return dict(session_date=session_date,user_id=user_id,end_tables=end_tables,alarms=alarms)
        return dict(session_date=session_date,user_id=user_id,alarms=alarms)
    else:
        return {}

@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    if 'user_id' in session:
        user_id = session["user_id"]
        helpers.rest_status(user_id)
        helpers.update_progress_table(user_id)
        today = datetime.today().date()
        stared_items = db.execute("SELECT * FROM list_items AS li JOIN table_events AS te ON te.item_id = li.id WHERE li.status = false AND li.star = true ORDER BY te.date, te.timer LIMIT 10")
        events=db.execute("SELECT table_events.*, list_items.item FROM table_events JOIN list_items ON table_events.item_id = list_items.id ORDER BY date, timer LIMIT 10")
        links = db.execute("SELECT list_tables.id, list_tables.title, list_tables.type FROM list_tables ORDER BY list_tables.type DESC,list_tables.title ASC")
        linked_items=db.execute("SELECT 'category' AS type, c.id, c.category AS item, NULL AS item_category, c.table_id FROM categories c UNION SELECT 'item' AS type, i.id, i.item, i.category_id As item_category , c.table_id FROM list_items i JOIN categories c ON i.category_id = c.id GROUP BY i.item")

        completed_count = db.execute("SELECT COUNT(*) FROM table_events WHERE status = 1")[0]['COUNT(*)']
        total_count = db.execute("SELECT COUNT(*) FROM table_events")[0]['COUNT(*)']
        if total_count > 0:
            progress = round(completed_count / total_count * 100)
        else:
            progress = 0
        helpers.update_tables_progress(0,'main',progress)
        return render_template("index.html",durations =durations,stared_items=stared_items, events=events,today=today, progress=progress,links=links,link_items=linked_items)

        #return render_template("index.html",session=session)



@app.route('/login', methods=["GET", "POST"])
def login():
    # Forget any user_id
    session.clear()
    if request.method == "POST":
        # get form data
        type = request.form.get("loginType")
        username = request.form.get('username')
        password = request.form.get('password')
        # case login
        if type == 'login':
            # validate data
            if not username:
                 message = "must provide username"
                 return render_template("/login.html",message=message)
            elif not password :
                 message = "must provide password"
                 return render_template("/login.html",message=message)
            else:
                rows = db.execute("SELECT * FROM users WHERE username = ?", username)
                if len(rows) != 1 or not check_password_hash(rows[0]["hash"], password):
                     message = "invalid username and/or password"
                     return render_template("/login.html",message=message)
                else:
                    # Remember which user has logged in
                    session["user_id"] = rows[0]["id"]
                    session["date"] = rows[0]['date']
                    session['username']=rows[0]['username']
        else:
            #case new register
            existing_user = db.execute("SELECT * FROM users WHERE username = ?", username)
            # validate data
            if not username or existing_user:
                message= "Invalid username the username already exist"
                return render_template("/login.html",message=message)
            if not password:
                message = "Invalid PASSWORD"
                return render_template("/login.html",message=message)
            # add new user
            hash = generate_password_hash(password)
            db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", username, hash)
            rows = db.execute("SELECT * FROM users WHERE username = ?", username)
            # login and remember the new user
            session["user_id"] = rows[0]["id"]
            session["date"] = rows[0]['date']
            session['username']=rows[0]['username']
        # Redirect user to home page
        flash('You have successfully logged in!', 'success')
        return redirect("/")
    return render_template("/login.html")


@app.route("/logout" ,methods=["POST"])
def logout():
    """Log user out"""
    session.clear()
    return render_template("/login.html")


@app.route('/browse/<item>')
@login_required
def browse(item):
    categories = {'todo': 'To Do List', 'calc': 'Calculators', 'table': 'Timetables'}
    if item =='all':
        items = db.execute("select * FROM list_tables WHERE user_id = ?",session["user_id"])
    elif item == 'tour':
        items = db.execute("select * FROM list_tables WHERE user_id = 1")
        item = 'all'
    else :
        items = db.execute("select * FROM list_tables WHERE type = ? AND user_id = ?", item, session["user_id"])
        categories = {item: categories.get(item, '')}
    return render_template('browse.html', items=items, categories=categories)

@app.route('/create/<item>', methods=["GET", "POST"])
@login_required
def create(item):
    #get data required for rendering the page
    today = datetime.today().date()
    calc_tables =  db.execute("select id,title FROM list_tables WHERE type = 'calc' and user_id = ?",session["user_id"])
    print(item)
    if request.method == 'POST':
       # get form data
       title = request.form.get('title')
       categories_list = request.form.getlist('categories')
       start_date = request.form.get('startDate')
       goals = request.form.get('goals')
       notes = request.form.get('notes')
       end_date = request.form.get('endDate')
       duration = request.form.get('durationSelect')
       print(title,categories_list,start_date,end_date,duration,goals,notes)
       # creat new table
       data = db.execute("select title FROM list_tables WHERE type = ? AND title = ? AND user_id = ?",item, title, session['user_id'])
       if not data:
           db.execute("INSERT INTO list_tables (type, title, description,duration, start_date, end_date, goal, user_id) VALUES (?, ?, ?, ?, ?, ?, ?,?)", item, title, notes, duration, start_date, end_date, goals,session['user_id'])
           # add new table's categories
           table_ids = db.execute("select id FROM list_tables WHERE type = ? AND title = ?",item, title)
           table_id=table_ids[0]['id']
           if categories_list:
               categories = db.execute("SELECT category FROM categories WHERE table_id = ?", table_id)
               for category in categories_list:
                  if not any(cat['category'] == category for cat in categories):
                     parts = category.split('_')
                     category = parts[0]
                     db.execute("INSERT INTO categories (table_id, category,duration) VALUES (?, ?, ?)",table_id, category, duration)
                     category_id = db.execute("select id FROM categories ORDER by id DESC limit 1")
                     #add table periods
                     if item == 'table':
                        start_timer = datetime.strptime(parts[1], '%I:%M %p').time()
                        end_timer = datetime.strptime(parts[2], '%I:%M %p').time()
                        db.execute("INSERT INTO periods (id,table_id, period,timer_start ,timer_end) VALUES (?, ?, ?,?,?)",category_id[0]['id'],table_id, category, str(start_timer)[:5], str(end_timer)[:5])

           elif item == 'table':
               for period in main_periods:
                db.execute("INSERT INTO categories (table_id, category,duration) VALUES (?, ?, ?)",table_id, period['period'], duration)
                category_id = db.execute("select id FROM categories ORDER by id DESC limit 1")
                db.execute("INSERT INTO periods (id,table_id, period,timer_start ,timer_end) VALUES (?, ?, ?,?,?)",category_id[0]['id'],table_id, period['period'], period['timer_start'],period['timer_end'])
       else :
           # return a warning if table already exist
           categories = {'todo': 'To Do List', 'calc': 'Calculators', 'table': 'Timetables'}
           warning = f"A table of type '{categories[item]}' with the name '{title}' already exists."
           return render_template('create.html',today=today,calc_tables=calc_tables,item=item,warning=warning)

       # redirect to the new created table
       if item == 'todo':
             return redirect(url_for('todo', item=table_id))
       elif item == 'table':
             return redirect(url_for('table', item=table_id))
       elif item == 'calc':
            db.execute("INSERT INTO goals (table_id) VALUES (?)", table_id)
            imported_values = request.form.getlist('tables[]')
            if ( imported_values):
                for table in imported_values :
                    db.execute("INSERT INTO imported_values (table_id, imported_tables) VALUES (?, ?)", table_id, table)
            db.execute("INSERT INTO imported_values (table_id, imported_tables) VALUES (?, ?)", table_id, table_id)

            return redirect(url_for('calc', item=table_id))
       else :
            print('error')
    return render_template('create.html',item=item,today=today,calc_tables=calc_tables)


@app.route('/todo', methods=["GET"])
@login_required
def todo():
    today = datetime.today().date()
    table_id = request.args.get('item')
    todo_list = db.execute("SELECT *  FROM list_tables WHERE id = ? ",table_id)
    creat_date = todo_list[0]['timestamp'].split()[0]
    categories = db.execute("SELECT * FROM categories WHERE table_id = ?",table_id)
    category_ids = [cat['id'] for cat in db.execute("SELECT id FROM categories WHERE table_id = ?", table_id)]
    items = db.execute("SELECT  list_items.*,COALESCE(MIN(table_events.alarm), 0) AS alarm FROM list_items LEFT JOIN table_events ON list_items.id = table_events.item_id WHERE list_items.category_id IN (?) AND list_items.id NOT IN (select item_id from table_events where event_type = 'category')GROUP BY list_items.id",category_ids)
    total_items = len(items)
    completed = sum(1 for item in items if item['status'] == 1)
    progress = (completed / total_items * 100) if total_items > 0 else 0.0
    alarms = db.execute("SELECT * FROM table_events WHERE item_id IN (SELECT id FROM list_items WHERE category_id IN (?))",category_ids)
    current_links = db.execute("SELECT * FROM links ")
    links = db.execute("SELECT list_tables.id, list_tables.title, list_tables.type FROM list_tables WHERE id != ? ORDER BY list_tables.type DESC,list_tables.title ASC",table_id)
    print(todo_list)
    helpers.update_tables_progress(table_id,'table',progress)
    return render_template('todo.html',today=today,todo_list=todo_list,categories=categories,items=items,durations=durations,alarms=alarms,current_links=current_links,links=links,progress=progress,start=creat_date)


@app.route('/calc', methods=["GET", "POST"])
@login_required
def calc():
    if request.method == "POST":
        data = request.get_json()
        table_id =  data.get('table_id')
        items = db.execute("SELECT items_mapping.*, categories.category, items_value.item, items_value.value FROM items_mapping JOIN categories ON items_mapping.category_id = categories.id JOIN items_value ON items_value.id = items_mapping.item_id WHERE items_mapping.table_id = ? ", table_id)
        return jsonify({'items': items})
    # table data
    table_id = request.args.get('item')
    calculator = db.execute("SELECT *  FROM list_tables WHERE id = ? ", table_id)
    creat_date = calculator[0]['timestamp'].split()[0]
    # update goal values and progress
    goal_data = db.execute("SELECT * FROM goals WHERE table_id = ?",table_id)
    goal = goal_data[0]
    helpers.update_goal_values(goal,calculator[0]['duration'], calculator[0]['goal'], calculator[0]['end_date'])
    goal_data = db.execute("SELECT * FROM goals WHERE table_id = ?",table_id)[0]
    progress = abs(goal_data['current'] - goal_data['start']) * 100 / goal_data['target']
    helpers.update_tables_progress(table_id,'table',progress)
    # items data
    imported_tables = [imported['imported_tables'] for imported in db.execute("SELECT imported_tables FROM imported_values WHERE table_id = ? ", table_id)]
    values = db.execute("SELECT * FROM items_value WHERE table_id in (?)", imported_tables)
    categories = db.execute("SELECT * FROM categories WHERE table_id = ?", table_id)
    items = db.execute("SELECT items_mapping.*, categories.category, items_value.item, items_value.value FROM items_mapping JOIN categories ON items_mapping.category_id = categories.id JOIN items_value ON items_value.id = items_mapping.item_id WHERE items_mapping.table_id = ? ", table_id)
    # get the dates
    end_date = datetime.today().date()
    start_date_result = calculator[0]['start_date']
    start_date = datetime.strptime(start_date_result, '%Y-%m-%d').date()
    month_data = helpers.get_date_range(start_date, end_date,'calc')
    helpers.update_items_dates(month_data,items)
    # add categorie for new date
    last_month = list(month_data.keys())[-1]
    last_week = list(month_data[last_month].keys())[-1]
    current_week = int(last_week[4:])
    print(current_week,last_week,last_month)
    if categories:
        today_items= db.execute("SELECT items_mapping.*, categories.category FROM items_mapping JOIN categories ON items_mapping.category_id = categories.id WHERE items_mapping.table_id = ? AND date=?",table_id,end_date)
        if not today_items :
            for category in categories:
                db.execute("INSERT INTO items_mapping (table_id,category_id,item_id,date,count,total,week) VALUES (?, ?, ?, ?, ?, ?, ?)", table_id,category['id'],1,end_date,0,0,current_week)
    print(calculator,categories,values,items,start_date,end_date)
    return render_template('calc.html', calculator=calculator,progress=progress, goal_data= goal_data, categories=categories, values=values, items=items,month_data= month_data,start=creat_date)

@app.route('/table', methods=["GET", "POST"])
@login_required
def table():
   table_id = request.args.get('item')
   table = db.execute("SELECT * FROM list_tables WHERE id = ?",table_id)
   creat_date = table[0]['timestamp'].split()[0]
   duration = db.execute("SELECT duration FROM list_tables WHERE id = ?",table_id)
   start_date = datetime.strptime(table[0]['start_date'], '%Y-%m-%d').date()
   end_date = datetime.strptime(table[0]['end_date'], '%Y-%m-%d').date()
   days = helpers.get_date_range(start_date, end_date,'table')
   category_ids = [cat['id'] for cat in db.execute("SELECT id FROM categories WHERE table_id = ?", table_id)]
   items = db.execute("SELECT li.id AS item_id, li.item, li.link, li.star, li.category_id , c.category, c.duration AS category_duration, te.id AS id,te.color, te.date AS date, te.timer AS timer, te.event_type, te.period_id, te.frequency ,te.status AS status, te.alarm FROM list_items li JOIN categories c ON li.category_id = c.id LEFT JOIN table_events te ON li.id = te.item_id WHERE te.period_id IN (?) ORDER BY CASE WHEN CAST(strftime('%H', te.timer) AS INTEGER) >= 6 THEN CAST(strftime('%H', te.timer) AS INTEGER) - 5 ELSE CAST(strftime('%H', te.timer) AS INTEGER) + 19 END",category_ids)
   periods = db.execute("SELECT * from periods where table_id = ? ORDER BY CASE WHEN CAST(strftime('%H', timer_start) AS INTEGER) >= 6 THEN CAST(strftime('%H', timer_start) AS INTEGER) - 5 ELSE CAST(strftime('%H', timer_start) AS INTEGER) + 19 END", table_id)
   current_links = db.execute("SELECT * FROM links ")
   links = db.execute("SELECT list_tables.id, list_tables.title, list_tables.type FROM list_tables WHERE id != ? ORDER BY list_tables.type DESC,list_tables.title ASC",table_id)
   linked_items=db.execute("SELECT 'category' AS type, c.id, c.category AS item, NULL AS item_category, c.table_id FROM categories c UNION SELECT 'item' AS type, i.id, i.item, i.category_id As item_category , c.table_id FROM list_items i JOIN categories c ON i.category_id = c.id GROUP BY i.item" )
   total_items = len(items)
   completed = sum(1 for item in items if item['status'] == 1)
   if total_items > 0:
        progress = completed / total_items * 100
   else:
        progress = 0.0
   helpers.update_tables_progress(table_id,'table',progress)
   print(table_id,table,category_ids,duration,days)
   return render_template('table.html',table=table, duration=duration,days=days,periods=periods,items=items,links=links,current_links=current_links,link_items=linked_items,progress=progress,start=creat_date)


@app.route("/events" ,methods=['GET','POST'])
@login_required
def events():
     events=db.execute("SELECT table_events.*, list_items.item, links.link as hyperlink FROM table_events JOIN list_items ON table_events.item_id = list_items.id LEFT JOIN links ON links.item_id = list_items.id ORDER BY date, timer")
     links = db.execute("SELECT list_tables.id, list_tables.title, list_tables.type FROM list_tables ORDER BY list_tables.type DESC,list_tables.title ASC")
     linked_items=db.execute("SELECT 'category' AS type, c.id, c.category AS item, NULL AS item_category, c.table_id FROM categories c UNION SELECT 'item' AS type, i.id, i.item, i.category_id As item_category , c.table_id FROM list_items i JOIN categories c ON i.category_id = c.id GROUP BY i.item")
     return render_template('events.html',events=events,durations=durations,links=links,link_items=linked_items)



@app.route('/preferences', methods=["GET", "POST"])
@login_required
def preferences():
   return render_template('preferences.html')


@app.route('/tutorial',methods=["post"])
def tutorial():
    data = request.get_json()
    template  = data.get('template')
    current  = data.get('current')
    page_messeges =''
    duration=0
    print(template)
    finale = db.execute("select * from page_messages WHERE page = 'finale'")
    if template != 'startTutorial':
        if template == 'intro':
            page_messeges = db.execute("select * from page_messages WHERE page = 'create'")
            total_duration = db.execute("SELECT duration from page_messages WHERE page = 'create' ORDER BY id DESC")
            duration = total_duration[0]['duration'] + 11000 if total_duration is not None else 0
        else:
            page_messeges = db.execute("select * from page_messages WHERE page = ?", template)
            total_duration = db.execute("SELECT duration from page_messages WHERE page = ? ORDER BY id DESC",template)
            duration = total_duration[0]['duration'] + 3000 if total_duration is not None else 0
        print(duration)
        print(page_messeges)
    if current != 1 :
        page_data = db.execute("select * from templates WHERE current_template = ?",template)
        next_page = page_data[0]['next_template']
    else:
        return jsonify({'page_messeges': page_messeges,'duration':duration ,'finale':finale})
    if next_page == 'finale':
        return jsonify({'page_messeges': page_messeges,'page':next_page,'duration':duration,'finale':finale})
    try:
        if page_data[0]['url']:
            if page_data[0]['item_id']:
                url = url_for(page_data[0]['url'], item=page_data[0]['item_id'])
            else:
                url = url_for(page_data[0]['url'])
        if url :
            print(template)
            print(url)

        return jsonify({'url': url,'page_messeges': page_messeges,'page':next_page,'current_page': template,'duration':duration,'finale':finale})
    except Exception as e:
        # Handle template not found error
        return jsonify({'status': 'error', 'message': str(e)})


@app.route('/update_selection', methods=['POST'])
def update_selecton():
    data = request.get_json()
    duration = data.get('duration')
    id = data.get('id')
    type = data.get('type')
    if type == 'category':
        db.execute("UPDATE categories SET duration = ? WHERE  id = ?", duration, id)
    elif type == 'event':
        db.execute("UPDATE table_events SET frequency = ? WHERE id = ?",duration, id)
    return jsonify({'status': 'success'})


@app.route('/delete_element', methods=['POST'])
def delete_element():
   try:
       data = request.get_json()
       item_id = data.get('item_id')
       type = data.get('type')
       if type == 'alarm' or type == 'table_event' :
           helpers.update_events('delete',item_id)
       elif type == 'item':
          helpers.update_items('delete',item_id)
       elif type == 'category' :
           helpers.update_categories('delete',item_id,'category')
       elif type == 'table':
           helpers.update_mainTables('delete',item_id)
       elif type == 'period':
           helpers.update_periods('delete',item_id)
       elif type == 'calc_category':
          helpers.update_calc_items('delete',item_id,'calc_category')
       elif type == 'calc_item':
          helpers.update_calc_items('delete',item_id,'calc_item')
       return jsonify({'status': 'success'})
   except Exception as e:
       # Return a JSON response indicating failure
       return jsonify({'status': 'error', 'message': str(e)})


@app.route('/update_element', methods=['POST'])
def update_element():
    try:
        # Get form data
        update_type = request.form.get('updateType')
        element_type = request.form.get('elementType')
        form_data = request.form.get('data')
        element_id = request.form.get('id')

        # Access the data as needed
        print('Form Data:',form_data)
        print('Update Type:', update_type)
        print('Element Type:', element_type)
        print('Element id:', element_id)
        new_element = 1
        if element_type == 'table':
            new_element = helpers.update_mainTables(update_type,element_id)
        elif element_type == 'alarm' or element_type == 'table_event' :
            new_element = helpers.update_events(update_type,element_id)
        elif element_type == 'category':
                new_element = helpers.update_categories(update_type,element_id,'category')
        elif element_type == 'item':
            new_element = helpers.update_items(update_type,element_id)
        elif element_type == 'period':
            new_element = helpers.update_periods(update_type,element_id)
        elif element_type == 'category_accordion':
            new_element = helpers.update_calc_items(update_type,element_id,'calc_category')
        elif element_type == 'calc_item' :
             new_element = helpers.update_calc_items(update_type,element_id,'calc_item')
        # Return the updated data along with update type
        print('new_element:',new_element)
        return jsonify({'status': 'success', 'data': new_element})
    except Exception as e:
       # Return a JSON response indicating failure
       return jsonify({'status': 'error', 'message': str(e)})


@app.route('/toggel_items_status', methods=['POST'])
def toggel_items():
    try:
        # Get data from the JSON request
        data = request.get_json()
        itemId = data.get('itemId')
        newState = data.get('newState')
        type = data.get('type')
        table = data.get('table')

        # Update the corresponding item's state in the database
        if table == 'item':
           if type == 'status':
                db.execute("UPDATE list_items SET status = ? WHERE id = ?",newState, itemId)
                helpers.update_tables_progress(itemId,'item',newState*100)
                db.execute("UPDATE table_events SET status = ? WHERE item_id = ?",newState, itemId)
                helpers.update_tables_progress(itemId,'event',newState*100)
           elif type == 'link':
                db.execute("UPDATE list_items SET link = ? WHERE id = ?",newState, itemId)
           elif type == 'star':
                db.execute("UPDATE list_items SET star = ? WHERE id = ?",newState, itemId)
           elif type == 'alarm':
               event = db.execute("SELECT * FROM table_events WHERE item_id = ?" ,itemId)
               if event:
                  db.execute("UPDATE table_events SET alarm = ? WHERE item_id = ?",newState, itemId)
        else :
           if type == 'alarm':
                db.execute("UPDATE table_events SET alarm = ? WHERE id = ?",newState, itemId)
           elif type == 'star':
                db.execute("UPDATE list_items SET star = ? WHERE id = ?",newState, itemId)
           if table =='events' and type == 'status':
                db.execute("UPDATE table_events SET status = ? WHERE id = ?",newState, itemId)
                event = db.execute("SELECT item_id FROM table_events WHERE id = ?" ,itemId)
                helpers.update_tables_progress(itemId,'event',newState*100)
                event_status= db.execute("SELECT status FROM table_events WHERE item_id = ?" ,event[0]['item_id'])
                status = 0
                for event in event_status:
                    if event['status'] == 0:
                        status = 0
                    else :
                        status = 1
                db.execute("UPDATE list_items SET status = ? WHERE id = ?",status, event[0]['item_id'])
                helpers.update_tables_progress(itemId,'item',status*100)
        return jsonify({'status': 'success', 'newState': newState})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})


@app.route('/editlink', methods=['POST'])
def editlink():
     try:
        # Get data from the JSON request
        data = request.get_json()
        print('Received data:', data)
        item = data.get('linkdata')
        print('item:',item)
        if item['type'] == 'add':
             db.execute("INSERT INTO links (item_id,table_id,link) VALUES (?, ?,?)", item['item_id'],item['table_id'],item['link'])
             newlink = db.execute("SELECT * FROM links WHERE item_id = ?", item['item_id'])
        else:
            print(item['item_id'])
            db.execute("DELETE FROM links WHERE item_id = ?", item['item_id'])
            newlink = [{'item_id': item['item_id']}]
        return jsonify({'status': 'success', 'newlink': newlink})
     except Exception as e:
        # Return a JSON response indicating failure
        return jsonify({'status': 'error', 'message': str(e)})


@app.route('/update_numbers', methods=['POST'])
def update_numbers():
    data = request.get_json()
    updated_value = data.get('updated_value')
    table_id = data.get('table_id')
    type = data.get('type')
    if type == 'item' or type == 'category':
         item_id = data.get('item_id')
         if type == 'item':
             total = data.get('total')
    end_date = datetime.today().date()
    items_list = []
    if type == 'category':
        db.execute("UPDATE items_mapping set factor = ? WHERE category_id = ?", int(updated_value),item_id)
        db.execute("UPDATE categories set duration = ? WHERE id = ?", int(updated_value),item_id)
        dates = db.execute("select date,week from items_mapping where category_id = ? GROUP BY date",item_id)
    elif type == 'item':
        db.execute("UPDATE items_mapping set count = ?,total = ? WHERE id = ?", int(updated_value),int(total),item_id)
        dates = db.execute("select date,week from items_mapping where id = ? ",item_id)
    elif type == 'total_log':
        dates = db.execute("select date,week from items_mapping where table_id = ? and date <= ?",table_id,updated_value)
        end_date = updated_value
    else:
       query = f"UPDATE goals SET {type} = ? WHERE table_id = ?"
       db.execute(query,updated_value,table_id)
       goal_data = db.execute("SELECT * FROM goals WHERE table_id = ?",table_id)[0]
       progress = abs(goal_data['current'] - goal_data['start']) * 100 / goal_data['target']
       items_list.append({'id':type, 'value':updated_value})
       items_list.append({'id':'progress', 'value':progress})
    if type == 'item' or type == 'category' or type == 'total_log':
        for date in dates:
            year, month, day = map(int, date['date'].split('-'))
            current_date = datetime.strptime(date['date'], '%Y-%m-%d')
            month_str = current_date.strftime('%B') + '-' + str(current_date.month)
            weekday_name = datetime(year, month, day).strftime('%a')
            day_total = db.execute("SELECT sum (total * factor) as total FROM items_mapping WHERE date = ? and table_id = ? ",date['date'],table_id)
            day_total_dict = {'id':'{}-Week{}'.format(weekday_name,date['week']), 'value': day_total[0]['total']}
            week_total = db.execute("SELECT sum (total * factor) as total FROM items_mapping  WHERE week = ? and table_id = ? and date <= ?",date['week'],table_id,end_date )
            month_total = db.execute("SELECT sum (total * factor) as total FROM items_mapping WHERE strftime('%Y-%m', date) = ? and table_id = ? and date <= ?", date['date'][:7],table_id,end_date)
            week_total_dict = {'id': 'Week{}'.format(date['week']), 'value': week_total[0]['total']}
            week_month_total_dict = {'id': 'Week{}-{}'.format(date['week'],month_str), 'value': week_total[0]['total']}
            month_total_dict = {'id': '{}'.format(month_str), 'value': month_total[0]['total']}
            items_list.append(day_total_dict)
            items_list.append(week_month_total_dict)
            items_list.append(week_total_dict)
            items_list.append(month_total_dict)
        calculator = db.execute("SELECT *  FROM list_tables WHERE id = ? ", table_id)
        goal =db.execute("SELECT *  FROM goals WHERE table_id = ? ", table_id)
        helpers.update_goal_values(goal[0],calculator[0]['duration'], calculator[0]['goal'], calculator[0]['end_date'])
        goal_data = db.execute("SELECT * FROM goals WHERE table_id = ?",table_id)
        items_list.append({'id':'currrent','value':goal_data[0]['current']})
        if type != 'total_log':
            progress = abs(goal_data[0]['current'] - goal_data[0]['start']) * 100 / goal_data[0]['target']
            items_list.append({'id':'progress','value':progress})
    return jsonify({'status': 'success','items': items_list})


@app.route('/calculate_avgtotals', methods=['POST'])
def calculate_avgtotals():
    table_id = request.form.get('table_id')
    type = request.form.get('dataType')
    time = request.form.get('time')
    period = request.form.get('period')
    periodType = request.form.get('periodType')
    n = int(period)
    today = datetime.today().date()
    if time == 'last':
        if periodType == 'days':
            n-=1
            start_date = today  - timedelta(days=n)
        elif periodType == 'weeks':
            n = (today.weekday() + 2) % 7  if n == 1 else (n-1) * 7 + (today.weekday() + 2) % 7
            start_date = today  - timedelta(days=n)
        elif periodType == 'months':
            start_date = datetime(today.year, today.month, 1).date()
            if n != 1:
                start_date = start_date - relativedelta(months=n-1)
    else:
        start_date_result = db.execute("SELECT start_date  FROM list_tables WHERE id = ? ",table_id)
        start_date = datetime.strptime(start_date_result[0]['start_date'], '%Y-%m-%d').date()
    print(n)
    dates = helpers.get_date_range(start_date, today, 'totals')
    if type == 'avg':
        avg = db.execute("SELECT ROUND(AVG(subquery.total), 2) AS avg FROM ( SELECT SUM(total * factor) AS total  FROM items_mapping  WHERE table_id = ? AND date IN (?)  AND item_id <> 1   GROUP BY date) AS subquery;",table_id,dates)
        result = avg[0]['avg']
    elif type == 'total':
        total = db.execute("SELECT SUM(total * factor) AS sum FROM items_mapping WHERE table_id = ? and date in (?) and item_id <> 1",table_id,dates)
        result = total[0]['sum']
    elif type == 'pieChart':
        if  periodType == 'days':
            result = db.execute("SELECT date ,ROUND((SUM(total * factor)*100/(SELECT SUM(total * factor) FROM items_mapping where table_id = ?)),2) AS avg,SUM(total * factor) as total  FROM items_mapping WHERE table_id = ? and date in(?) GROUP BY date;",table_id,table_id,dates)
        elif periodType == 'weeks':
            result = db.execute("SELECT week,ROUND((SUM(total * factor)*100/(SELECT SUM(total * factor) FROM items_mapping where table_id = ?)),2) AS avg,SUM(total * factor) as total  FROM items_mapping WHERE table_id = ? and date in(?)  GROUP BY week;",table_id,table_id,dates)
        elif periodType == 'months':
            result = db.execute("SELECT strftime('%Y-%m', date) as month ,ROUND((SUM(total * factor)*100/(SELECT SUM(total * factor) FROM items_mapping where table_id = ?)),2) AS avg,SUM(total * factor) as total  FROM items_mapping WHERE table_id = ? and date in(?) GROUP BY strftime('%Y-%m', date);",table_id,table_id,dates)
        elif periodType == 'categories':
            result = db.execute("SELECT category,factor, ROUND((SUM(total * factor)*100/(SELECT SUM(total * factor) FROM items_mapping where table_id = ?)),2) AS avg,SUM(total * factor) as total FROM items_mapping join categories on categories.id = items_mapping.category_id WHERE items_mapping.table_id = ? and date in(?) GROUP BY category_id",table_id,table_id,dates)
    elif type == 'chart':
        if  periodType == 'days':
            result = db.execute("SELECT date,SUM(total * factor) as total  FROM items_mapping  WHERE table_id = ? and date in(?) and item_id <> 1 GROUP BY date;",table_id,dates)
        elif periodType == 'weeks':
            result = db.execute("SELECT week,ROUND(avg(total * factor),2) AS avg,SUM(total * factor) as total FROM items_mapping WHERE table_id = ? and date in(?) and item_id <> 1 GROUP BY week;",table_id,dates)
        elif periodType == 'months':
            result = db.execute("SELECT strftime('%Y-%m', date) As month ,ROUND(avg(total * factor),2) AS avg,SUM(total  * factor) as total  FROM items_mapping WHERE table_id = ? and date in(?) and item_id <> 1 GROUP BY strftime('%Y-%m', date);",table_id,dates)
        elif periodType == 'categories':
            result = db.execute("SELECT category,SUM(total* factor) as total, factor FROM items_mapping join categories on categories.id = items_mapping.category_id WHERE items_mapping.table_id = ?  and date in(?) and item_id <> 1 GROUP BY category_id",table_id,dates)
    return jsonify({'status': 'success','result': result})


@app.route("/progress", methods=["GET","POST"])
def progress():
    data = request.json
    page = data.get('page')
    selected_day = data.get('selectedDate')
    table_id = data.get('item')
    print('id page',table_id,page)
    today = datetime.today().date()
    exist = db.execute("SELECT * FROM progress WHERE date = ? and user_id = ?", selected_day,session['user_id'])
    if not exist :
        previous_date = db.execute("SELECT date FROM progress WHERE date < ?  and user_id = ? ORDER BY date DESC limit 1", selected_day,session['user_id'])
        day = previous_date[0]['date']
        selected_day = day
        if table_id and page != 'Calculator':
            start_date = db.execute("SELECT start_date FROM list_tables WHERE id = ?",table_id)
            if datetime.strptime(day, '%Y-%m-%d').date() < datetime.strptime(start_date[0]['start_date'], '%Y-%m-%d').date():
               selected_day = None
    if page == 'Events':
        items = db.execute("SELECT p.item_id AS id, p.value AS status FROM progress p JOIN table_events te ON p.item_id = te.id WHERE p.date = ? AND p.type = 'event';",selected_day)
        return jsonify({'selected_day': selected_day,'items':items,'page':page})
    else:
        if selected_day :
            if table_id:
                progress = db.execute("SELECT value FROM progress WHERE date = ? AND type = 'table' AND item_id = ?", selected_day,table_id)
                category_ids = [cat['id'] for cat in db.execute("SELECT id FROM categories WHERE table_id = ?", table_id)]
            else:
                progress = db.execute("SELECT value FROM progress WHERE date = ? AND type = 'main' And user_id = ?", selected_day,session['user_id'])
                if not progress:
                    progress = 0
                progress = progress[0]['value']
                return jsonify({'selected_day': selected_day, 'progress':progress,'page':page})
            progress = progress[0]['value']
        else:
            if table_id:
                category_ids = [cat['id'] for cat in db.execute("SELECT id FROM categories WHERE table_id = ?", table_id)]
            progress = 0
        if page == 'List':
            if selected_day:
                items = db.execute("SELECT item_id as id , value as status FROM progress where date = ? and item_id in (SELECT id from list_items where category_id in (?))",selected_day,category_ids)
            else :
                items = db.execute("SELECT id ,0 As status FROM list_items where category_id in (?)",category_ids)
        elif page == 'Table':
            if selected_day:
                dates = db.execute("SELECT * FROM list_tables WHERE id = ?",table_id)
                if datetime.strptime(dates[0]['end_date'], '%Y-%m-%d').date() >= datetime.strptime(selected_day, '%Y-%m-%d').date() >= datetime.strptime(dates[0]['start_date'], '%Y-%m-%d').date():
                    items = db.execute("SELECT p.item_id AS id, p.value AS status,te.color, te.timer, te.date FROM progress p JOIN table_events te ON p.item_id = te.id WHERE p.date = ? AND p.type = 'event' AND te.period_id in(?) ORDER BY te.timer ",selected_day,category_ids)
                else:
                    items = db.execute("SELECT p.item_id AS id, p.value AS status FROM progress p JOIN table_events te ON p.item_id = te.id WHERE p.date = ? AND p.type = 'event' AND te.period_id in(?)",selected_day,category_ids)
            else :
                items = db.execute("SELECT id,0 As status , timer, date FROM table_events te WHERE te.period_id in(?)",category_ids)
        elif page == 'Calculator':
            start_date_result = db.execute("SELECT start_date  FROM list_tables WHERE id = ? ",table_id)
            start_date = datetime.strptime(start_date_result[0]['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(selected_day, '%Y-%m-%d').date()
            month_data = helpers.get_date_range(start_date, end_date,'calc')
            items = db.execute("SELECT items_mapping.*, categories.category, items_value.item, items_value.value FROM items_mapping JOIN categories ON items_mapping.category_id = categories.id JOIN items_value ON items_value.id = items_mapping.item_id WHERE items_mapping.table_id = ? and date <= ? ", table_id,selected_day)
            return jsonify({'selected_day': selected_day, 'progress':progress,'items':items,'page':page,'month_data':month_data})
        print(progress,items)

    print(selected_day,today)
    return jsonify({'selected_day': selected_day, 'progress':progress,'items':items,'page':page})


@app.route('/get_category_items', methods=['POST'])
def get_category_items():
    data = request.get_json()
    category_id = data.get('category_id')
    items = db.execute("SELECT list_items.* ,links.link AS hyperlink FROM list_items left join links on list_items.id = links.item_id WHERE category_id = ? AND list_items.id NOT IN (SELECT item_id FROM table_events WHERE event_type = 'category')", category_id)
    return jsonify({'status': 'success','items': items})


@app.route('/update_color', methods=[ "POST"])
def update_color():
     data = request.get_json()
     id = data.get('id')
     color = data.get('color')
     db.execute("update table_events set color = ? where id = ?",color,id)
     return jsonify({'status': 'success'})


@app.route('/get_spans', methods=["POST"])
def get_spans():
    data = request.get_json()
    type_value = data.get('type')
    id_value = data.get('id')
    table_id = data.get('table_id')
    page = data.get('page')
    days = data.get('days')
    print(id_value)
    if page == 'Home' :
        today = datetime.today().date()
        date_string = days[0]
        date_from_days = datetime.strptime(date_string, '%Y-%m-%d').date()
        if date_from_days < today:
             new_items = helpers.get_oldtable_items(days)
        else:
             new_items = db.execute("SELECT li.id AS item_id,li.category_id, li.item, li.link, li.star, c.category, c.duration AS category_duration, te.id AS id,te.color, te.date AS date, te.timer AS timer, te.event_type, te.period_id, te.frequency ,te.status AS status, te.alarm FROM list_items li JOIN categories c ON li.category_id = c.id LEFT JOIN table_events te ON li.id = te.item_id WHERE te.date IN (?) and te.status = 0 ORDER BY CASE WHEN CAST(strftime('%H', te.timer) AS INTEGER) >= 6 THEN CAST(strftime('%H', te.timer) AS INTEGER) - 5 ELSE CAST(strftime('%H', te.timer) AS INTEGER) + 19 END",days)
        print(days[0],today)
        print(page,days)
        new_periods = db.execute("SELECT * from periods where table_id = 2 ORDER BY id")

    else :
        period_table_id =db.execute("SELECT table_id from periods where id = ? ",id_value)
        if not period_table_id:
             period_table_id =db.execute("SELECT periods.table_id FROM periods JOIN table_events ON table_events.period_id = periods.id WHERE table_events.id = ?",id_value)
        table_id = period_table_id[0]['table_id']
        print(id_value,type_value,table_id)
        category_ids = [cat['id'] for cat in db.execute("SELECT id FROM categories WHERE table_id = ?", table_id)]
        new_items = db.execute("SELECT li.id AS item_id,li.category_id, li.item, li.link, li.star, c.category, c.duration AS category_duration, te.id AS id,te.color , te.date AS date, te.timer AS timer, te.event_type, te.period_id, te.frequency ,te.status AS status, te.alarm FROM list_items li JOIN categories c ON li.category_id = c.id LEFT JOIN table_events te ON li.id = te.item_id WHERE te.period_id IN (?) ORDER BY CASE WHEN CAST(strftime('%H', te.timer) AS INTEGER) >= 6 THEN CAST(strftime('%H', te.timer) AS INTEGER) - 5 ELSE CAST(strftime('%H', te.timer) AS INTEGER) + 19 END",category_ids)
        new_periods = db.execute("SELECT * from periods where table_id = ? ORDER BY timer_start", table_id)

    new_colspan = helpers.calculate_periods_colspan(new_periods,new_items,days)
    return jsonify({'status': 'success', 'colspan': new_colspan })


@app.route('/generate_table', methods=["POST"])
def main_table():
    # Get the data from the POST request
    data = request.get_json()
    n_days = data.get('selectedValue')
    date = data.get('date')
    last_update_date = data.get('last_update_date')
    n_days = int(n_days) - 1
    start_date = datetime.strptime(date, '%Y-%m-%d').date()
    if n_days == 29 :
        end_date = start_date + relativedelta(months=1) - timedelta(days=1)
    else:
        end_date = start_date + timedelta(days=int(n_days))
    print('Selected Value:', n_days,end_date)
    days = helpers.get_date_range(start_date, end_date,'table')
    formatted_dates = []
    today = datetime.today().date()
    for day in days:
        date_part = day.split(',')[1].strip()
        date_object = datetime.strptime(date_part, '%Y-%m-%d')
        formatted_date = date_object.strftime('%Y-%m-%d')
        formatted_dates.append(formatted_date)
    print(formatted_dates,today,date,last_update_date)
    periods = db.execute("SELECT * from periods where table_id = 2 ORDER BY id")
    current_links = db.execute("SELECT * FROM links ")
    if start_date != today :
        items = helpers.get_oldtable_items(formatted_dates)
        checkitems = db.execute("SELECT item_id AS id, value AS status FROM progress WHERE date = ? AND type = 'event' ",last_update_date)
    else:
        checkitems=[]
        items = db.execute("SELECT li.id AS item_id, li.item,li.category_id, li.link, li.star, c.category, c.duration AS category_duration, te.id AS id, te.date AS date, te.color, te.timer AS timer, te.event_type, te.period_id, te.frequency ,te.status AS status, te.alarm FROM list_items li JOIN categories c ON li.category_id = c.id LEFT JOIN table_events te ON li.id = te.item_id WHERE te.date IN (?) and te.status = 0 ORDER BY CASE WHEN CAST(strftime('%H', te.timer) AS INTEGER) >= 6 THEN CAST(strftime('%H', te.timer) AS INTEGER) - 5 ELSE CAST(strftime('%H', te.timer) AS INTEGER) + 19 END",formatted_dates)
    colspan = helpers.calculate_periods_colspan(periods,items,formatted_dates)
    return jsonify({'status': 'success','colspan':colspan ,'current_links':current_links, 'items': items,'days':days,'periods':periods,'checkitems':checkitems})



if __name__ == "__main__":
    app.run(debug=True)
