import os

from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session, jsonify, url_for
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import re
import test

from functools import reduce,wraps
from math import gcd
import spacy

# Load the spaCy English model
nlp = spacy.load("en_core_web_sm")

db = SQL("sqlite:///tables.db")

main_periods = db.execute("SELECT period, timer_start, timer_end FROM periods WHERE table_id = 2")


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


def get_end_tables(user_id):
    today = datetime.today().date().strftime('%Y-%m-%d')
    table_ids =  db.execute("select id FROM list_tables  WHERE type <> 'calc' and user_id = ? and end_date = ? ",user_id,today)
    table_id = [row['id'] for row in table_ids]
    print(table_id)
    end_tables =  db.execute("select list_tables.title,list_tables.duration,progress.value as progress FROM list_tables LEFT JOIN progress on progress.item_id = list_tables.id WHERE progress.type = 'table' and progress.item_id in (?) AND progress.date = ? ",table_id,today)
    return end_tables

def update_items_dates(month_data,items):
    print('function called')
    for item in items:
        print('function called',item)
        for month, weeks in month_data.items():
            print('function called',month)
            for week, dates in weeks.items():
                week_number = re.search(r'\d+', week).group()
                print('function called',week)
                for date in dates:
                     if item['date'] == date.split(',')[1].strip():
                       db.execute("UPDATE items_mapping SET week = ? WHERE id = ?", week_number,item['id'])

    return


def get_date_range(start_date, end_date,type):
    current_date = start_date
    month_data = {}
    week = {}
    n = 1
    month = current_date.strftime('%B')+ '-' + str(current_date.month)
    week[f'Week{n}'] = []
    month_data[month] = week.copy()
    days = []


    while current_date <= end_date:
        day_of_week = current_date.strftime('%A')  # Full day name
        day_of_month = current_date.day
        month = current_date.strftime('%B') + '-' + str(current_date.month)  # Full month name
        year = current_date.year
        if type == 'table':
            days.append(current_date.strftime("%a,%Y-%m-%d"))
        elif type == 'totals':
            days.append(current_date.strftime("%Y-%m-%d"))
        else:
            if day_of_month == 1:
                month_data[month] = {f'Week{n}':[current_date.strftime("%a,%Y-%m-%d")]}
                print(month_data[month])
                week[f'Week{n}'].append(current_date.strftime("%a,%Y-%m-%d"))
                print(week[f'Week{n}'])
            else:
                if day_of_week == 'Saturday':
                    n += 1
                    week.setdefault(f'Week{n}', []).append(current_date.strftime("%a,%Y-%m-%d"))
                    month_data[month][f'Week{n}'] = week[f'Week{n}'].copy()
                    print("Final 'n' value:", n )
                    print("Keys in 'week' dictionary:", list(week.keys()))
                    print(week[f'Week{n}'],week,month_data[month])
                else:
                    date_str = current_date.strftime("%a,%Y-%m-%d")
                    if date_str not in month_data[month][f'Week{n}']:
                        month_data[month][f'Week{n}'].append(date_str)
                    print(f'week{n}: {week[f"Week{n}"]}, month_data: {month_data}')
        current_date += timedelta(days=1)

    if type == 'table' or type == 'totals':
        return days
    else:
        return month_data



def get_time_period(periodtime,type):
     # Define regular expressions for 12-hour and 24-hour time formats
    pattern_12hr = re.compile(r'(\d{1,2}):(\d{2})([APMapm]{2})')
    pattern_24hr = re.compile(r'(\d{1,2}):(\d{2})')

    # Try matching with 12-hour format
    match_12hr = pattern_12hr.match(periodtime)
    if match_12hr:
        hour = int(match_12hr.group(1))
        am_pm = match_12hr.group(3).lower()

        if am_pm == 'pm' and hour != 12:
            hour += 12
    else:
        # If 12-hour format fails, try matching with 24-hour format
        match_24hr = pattern_24hr.match(periodtime)
        if match_24hr:
            hour = int(match_24hr.group(1))
        else:
            # If both formats fail, return a default value or handle it as needed
            return -1


    if 6 <= hour <= 12:
        return 2 if type == 'start' and hour == 12 else 1
    elif 12 <= hour <= 18:
        return 3 if type == 'start' and hour == 18 else 2
    elif 18 <= hour <= 24:
        return 4 if type == 'start' and hour == 24 else 3
    else:
        return 1 if type == 'start' and hour == 6 else 4


def lcm(x, y):
    """Calculate the least common multiple of x and y."""
    return x * y // gcd(x, y)


def calculate_periods_colspan(periods,items,days):
   # Initialize variables
    (m, a, n, d, x, z) = (0, 0, 0, 0, 0, 0)
    up = 1
    col_span={}
    main_table = all(period['table_id'] == 2 for period in periods)
    if periods:
        for period in periods:
            col_span[f'{period["id"]}'] = 0
            period_lengths = []
            if items:
                for day in days:
                    day_count = 0
                    for item in items:
                       if main_table :
                           item['period_id']= get_time_period(item['timer'],'event')
                       if item['date'] == day and item['period_id'] == period['id']:
                            day_count += up
                    if day_count != 0:
                        if  not main_table:
                             day_count += 1
                        period_lengths.append(day_count)
                if period_lengths:
                    lcm_result = reduce(lcm, period_lengths)
                    print('lcm',lcm_result,period_lengths)
                else:
                    lcm_result = 0  # Set a default value or ha
                col_span[f'{period["id"]}'] = lcm_result


        if main_table:
              print('main',col_span)
              return col_span
        else:
            for period in periods:
                up = col_span[f'{period["id"]}']if col_span[f'{period["id"]}'] != 0 else 1
                period_data = {'period': period['period'], 'timer_start': period['timer_start'], 'timer_end': period['timer_end']}
                period_items = [item for item in items if item['period_id'] == period['id']]
                if period_items and period_data not in main_periods:
                    p_start = get_time_period(period['timer_start'],'start')
                    p_end = get_time_period(period['timer_end'],'end')
                    x = abs(p_start - p_end) + 1
                    z = p_start
                    print('n,start,end',x,p_start,p_end)
                else:
                     x = 1
                for _ in range(x):
                        if z == 1:
                                m+=up
                        elif z == 2:
                                a+=up
                        elif z == 3:
                                n+=up
                        else :
                                d+=up
                        z = 1 if z == 4 else z + 1
                col_span[f'{period["id"]}'] = x * up
    elif items:
         for day in days:
            for item in items:
                z = get_time_period(item['timer'],'event')
                if z == 1:
                        m+=1
                elif z == 2:
                        a+=1
                elif z == 3:
                        n+=1
                else :
                        d+=1
    else:
        (m,a,n) = (1,1,1)

    col_span['m'] = m
    col_span['a'] = a
    col_span['n'] = n
    col_span['d'] = d

    print('normal',col_span)
    return col_span



def find_next_date(start_date, target_day):
    current_date = datetime.strptime(start_date, '%Y-%m-%d')
    if target_day.isdigit():
        target_day = int(target_day)
        while current_date.day != target_day:
            current_date += timedelta(days=1)
    elif isinstance(target_day, str):
        target_day = target_day.lower().capitalize()
        while current_date.strftime('%A') != target_day:
            current_date += timedelta(days=1)
    print(target_day,current_date.strftime('%Y-%m-%d'))
    return current_date.strftime('%Y-%m-%d')


def update_links():
    print('updatelinks')
    linked_items = [row['item_id'] for row in db.execute("SELECT item_id FROM links")]
    items = db.execute("select id , link from list_items")
    for item in items:
        link_status = 1 if item['id'] in linked_items else 0
        db.execute("UPDATE list_items SET link = ? WHERE id = ?", link_status, item['id'])


def update_mainTables(update_type,id):
     print('update_tables function called')
     try:
        title = request.form.get('title')
        start_date = request.form.get('startDate')
        goals = request.form.get('goals')
        notes = request.form.get('description')
        end_date = request.form.get('endDate')
        duration = request.form.get('durationSelect')

        print(end_date, notes, start_date, goals, title,duration)
        if update_type == 'update':
            db.execute("UPDATE list_tables SET title = ?,goal=?, start_date=?,end_date=?,description=?,duration=? WHERE id = ?",title,goals,start_date,end_date,notes,duration, id)
            new_element = db.execute("SELECT * FROM list_tables WHERE id = ?", id)
        elif update_type == 'delete':
             db.execute("DELETE FROM list_tables WHERE id = ?", id)
             update_links()
             return
        print('new_elementfun:',new_element)
        return new_element
     except Exception as e:
         print(f'Error in update_tables: {e}')
         return 'none'

def update_categories(update_type,id,type):
     print('update_categories function called')
     try:
        # Get form data from the request
        if type == 'period':
            category = request.form.get('period')
        else :
            category = request.form.get('Category')
        table_id = request.form.get('table_id')
        print('Form:', request.form)
        if update_type == 'create':
             # Create a new event dictionary
            categories = db.execute("SELECT category FROM categories WHERE table_id = ?", table_id)
            if not any(cat['category'] == category for cat in categories):
               db.execute("INSERT INTO categories (table_id, category,duration) VALUES (?, ?,?)",table_id, category,1)
               new_element = db.execute("SELECT * FROM categories WHERE table_id = ? And category = ?", table_id, category)
               if type == 'period' or type == 'calc_category':
                   return new_element[0]['id']
            else:
               if type == 'calc_category':
                    new_element = db.execute("SELECT * FROM categories WHERE table_id = ? And category = ?", table_id, category)
                    return new_element[0]['id']
               print('alredy exist')
               return 'alredy exist'
        elif update_type == 'update':
             db.execute("UPDATE categories SET category = ? WHERE id = ?",category, id)
             new_element = db.execute("SELECT * FROM categories WHERE id = ?",id)
        elif update_type == 'delete':
             db.execute("DELETE FROM categories WHERE id = ?", id)
             return
        print('new_element:',new_element)
        return new_element
     except Exception as e:
        print(f'Error in update_categories: {e}')
        return 'none'

def update_items(update_type,id):
     print('update_items function called')
     try:
        # Get form data from the request
        category_id = request.form.get('category_id')
        item = request.form.get('item')
        print(item,category_id)
        if update_type == 'create':
             # Create a new event dictionary
              items = db.execute("SELECT item FROM list_items WHERE category_id = ?", category_id)
              if not any(i['item'] == item for i in items):
                    db.execute("INSERT INTO list_items (category_id, item) VALUES (?, ?)",category_id, item)
                    new_element = db.execute("SELECT * FROM list_items WHERE category_id = ? And item = ?",category_id, item)
              else:
                    return 'alredy exist'
        elif update_type == 'update':
             db.execute("UPDATE list_items SET item = ? WHERE id = ?",item, id)
             new_element = db.execute("SELECT * FROM list_items WHERE id = ?",id)
        elif update_type == 'delete':
             db.execute("DELETE FROM list_items WHERE id = ?", id)
             return
        print('new_element:',new_element)
        return new_element
     except Exception as e:
        print(f'Error in update_items: {e}')
        return 'none'


def update_calc_items(update_type,id,type):
     print('update__calc_categories function called')
     today = datetime.now()
     str_today = today.strftime('%Y-%m-%d')
     current_month = today.month
     try:
        category = request.form.get('Category')
        table_id = request.form.get('table_id')
        date = request.form.get('date')
        week = request.form.get('week')
        item_id = request.form.get('item_id')
        category_id = request.form.get('category_id')
        item = request.form.get('name')
        if type == 'calc_item':
            item=item.lower() if item else ''
        count = request.form.get('count')
        value = request.form.get('value')
        factor = request.form.get('factor')
        value = value if value else 0
        if count and value:
             total = int(count) * int(value)
        else :
            total = 0
        print(request.form)
        print('Table ID:', table_id)
        if  update_type == 'create':
            if date.isdigit():
                 if int(date) < current_month:
                    date = datetime(today.year,int(date),28).strftime('%Y-%m-%d')
                 elif int(date) > current_month:
                    date = datetime(today.year-1,int(date),28).strftime('%Y-%m-%d')
                 else :
                    date = str_today
            elif week and not date:
                 week_dates =  db.execute("select date from items_mapping where table_id = ? and week = ? Order by date DESC limit 1",table_id,week)
                 date = week_dates[0]['date'] if week_dates else str_today
            elif not week and not date:
                date = str_today
            if not week:
                week_date =  db.execute("select week,date from items_mapping where table_id = ? Order by date DESC limit 1",table_id)
                if week_date and week_date[0]['date'] == date:
                    week = week_date[0]['week']
                else :
                    week = week_data[0]['week'] + 1
            if type == 'calc_category' :
                 category_id  = update_categories(update_type,id,'calc_category')
                 print(category_id)
                 item_id, count, total = 1, 0, 0
                 db.execute("INSERT INTO items_mapping (table_id,factor, category_id,item_id,date,count,total,week) VALUES (?, ?,?,?,?,?,?,?)",table_id,1, category_id,item_id,date,count,total,week)
                 new_element = db.execute("SELECT id ,category, duration as factor from categories where id = ?",category_id)
                 new_element[0]['date']= date
                 new_element[0]['week']= week
                 new_element[0]['parent_id'] = item
            if type == 'calc_item':
               print('calc_item')
               if not item_id :
                    db.execute("INSERT INTO items_value (table_id , item , value) Values (?,?,?)",table_id,item,value)
                    itemId = db.execute("SELECT id from items_value WHERE table_id = ? ORDER by id DESC LIMIT 1",table_id)
                    item_id = itemId[0]['id']
               db.execute("INSERT INTO items_mapping (table_id,factor, category_id,item_id,date,count,total,week) VALUES (?, ?,?,?,?,?,?,?)",table_id,factor, category_id,item_id,date,count,total,week)
               new_element = db.execute("SELECT items_mapping.*, items_value.value , items_value.item FROM items_mapping JOIN items_value ON items_value.id = items_mapping.item_id WHERE items_mapping.table_id = ? ORDER BY id DESC LIMIT 1",table_id)
        elif update_type == 'update':
                if type == 'calc_category' :
                    db.execute("UPDATE categories SET category = ? WHERE id = ?",category, id.split('-')[0])
                    new_element = db.execute("SELECT * FROM categories WHERE id = ?",id.split('-')[0])
                else:
                    db.execute("UPDATE items_value SET item = ? ,value = ? WHERE id = ?",item, value, item_id)
                    db.execute("UPDATE items_mapping SET total = count * (  SELECT  value  FROM items_value  WHERE items_value.id = items_mapping.item_id)")
                    new_element = db.execute("SELECT items_mapping.*, items_value.value ,items_value.item FROM items_mapping JOIN items_value ON items_value.id = items_mapping.item_id WHERE items_mapping.id = ? ORDER BY id DESC LIMIT 1",id.split('-')[0])
                new_element[0]['id'] = id
        elif update_type == 'delete':
                if type == 'calc_category' :
                    categories_items = db.execute("SELECT date from items_mapping WHERE category_id = ? and item_id <> 1 Group BY date",id)
                    if len(categories_items) <= 1:
                        db.execute("DELETE FROM categories WHERE id = ? ",  id)
                else:
                   db.execute("DELETE FROM items_mapping WHERE id = ? ",  id)
                return
        print('new_elementfun:',new_element)
        return new_element

     except Exception as e:
           print(f'Error in update_calc_categories: {e}')
           return 'none'


def update_periods(update_type,id):
     print('update_periods function called')
     try:
        period = request.form.get('period')
        table_id = request.form.get('table_id')
        timer_start = request.form.get('timer_start')
        timer_end = request.form.get('timer_end')
        print('period:', period)
        print('Table ID:', table_id)
        print('Timer:', timer_start,timer_end )
        if update_type == 'create':
            current_periods = db.execute("SELECT period, timer_start, timer_end FROM periods WHERE table_id = ?",table_id)
            if current_periods == main_periods:
                 print(current_periods,main_periods)
                 db.execute("DELETE FROM categories WHERE table_id = ?", table_id)
                 db.execute("DELETE FROM periods WHERE table_id = ?", table_id)
            period_id = update_categories(update_type,id,'period')
            db.execute("INSERT INTO periods (id,table_id,period,timer_start,timer_end) VALUES (?, ?,?,?,?)",period_id,table_id,period,timer_start,timer_end)
            new_element = db.execute("SELECT * FROM periods WHERE table_id = ? And period = ?", table_id, period)
        elif update_type == 'update':
             update_categories(update_type,id,'period')
             db.execute("UPDATE periods SET period = ?, timer_start=? ,timer_end = ? WHERE id = ?",period,timer_start,timer_end, id)
             new_element = db.execute("SELECT * FROM periods WHERE id = ?",id)
        elif update_type == 'delete':
             table_id = db.execute("SELECT table_id FROM periods WHERE id = ?",id)
             table_id = table_id[0]['table_id']
             db.execute("DELETE FROM table_events WHERE period_id = ?", id)
             db.execute("DELETE FROM periods WHERE id = ?", id)
             update_categories(update_type,id,'period')
             current_periods = db.execute("SELECT period, timer_start, timer_end FROM periods WHERE table_id = ?",table_id)
             if not current_periods:
                  for period in main_periods:
                    db.execute("INSERT INTO categories (table_id, category,duration) VALUES (?, ?, ?)",table_id, period['period'], 7)
                    category_id = db.execute("select id FROM categories ORDER by id DESC limit 1")
                    db.execute("INSERT INTO periods (id,table_id, period,timer_start ,timer_end) VALUES (?, ?, ?,?,?)",category_id[0]['id'],table_id, period['period'], period['timer_start'],period['timer_end'])
             return
        print('new_elementfun:',new_element)
        return new_element
     except Exception as e:
        print(f'Error in update_categories: {e}')
        return 'none'

def update_links(link,item_id):
    db.execute("update list_items set link = 1 where id = ?",item_id)
    print(link.split('?')[1].split('=')[1])
    links = db.execute("select * from links where item_id = ?",item_id)
    if not links :
        db.execute("INSERT INTO links (item_id,table_id,link) VALUES (?, ?,?)",item_id,link.split('?')[1].split('=')[1],link)


def update_events(update_type,id):
     print('update_events function called')
     try:
        # Get form data from the request
        user_id = request.form.get('user_id')
        date = request.form.get('Date')
        time = request.form.get('Time')
        event = request.form.get('Name')
        frequency = request.form.get('Type')
        period = request.form.get('period')
        element_id = request.form.get('item_id')
        category_id = request.form.get('category_id')
        event_type = request.form.get('event_type')
        link = request.form.get('link')
        print(request.form)
        alarm = 1 if event_type == 'alarm' else 0
        print('Form',request.form)
     except Exception as e:
         print(f'Error in update_tables: {e}')
     if update_type == 'create':
          if date:
            if not period :
                period = get_time_period(time,'event')
            else :
                period = int(period)
            print(period)
            if element_id and not category_id :
                category_id = element_id
            else :
                category_id = period
            if event_type == 'item' :
                item_id = int(element_id)
            else:
                items = db.execute("SELECT id FROM list_items where id in (select item_id from table_events where event_type = ?) and category_id = ? and item = ? ",event_type,category_id, event)
                if len(items) <= 0:
                        db.execute("INSERT INTO list_items (category_id, item) VALUES (?, ?)", category_id, event)
                        item_id = db.execute("SELECT id FROM list_items ORDER BY id DESC LIMIT 1")
                else:
                        item_id = db.execute("SELECT id FROM list_items where category_id = ? and item = ? ",category_id, event)
                item_id = item_id[0]['id']
            db.execute("INSERT INTO table_events (user_id,date, timer, event_type, item_id, period_id, frequency,alarm) VALUES (?,?, ?, ?, ?,?,?,?)",user_id,date, time, event_type, item_id, period, frequency, alarm)
            new_id = db.execute("SELECT id FROM table_events ORDER BY id DESC LIMIT 1")
            new_element=db.execute("SELECT li.id AS item_id, li.item, li.link, li.star, li.category_id , c.category, c.duration AS category_duration, te.id AS id, te.date AS date, te.timer AS timer, te.event_type, te.period_id, te.frequency ,te.status AS status, te.alarm FROM list_items li JOIN categories c ON li.category_id = c.id LEFT JOIN table_events te ON li.id = te.item_id WHERE te.id = ?",new_id[0]['id'])
            if event_type == 'table':
                if link:
                    new_element[0]['hyperlink'] = link
                    update_links(link,item_id)

     elif update_type == 'update':
            if date:
                 db.execute("UPDATE table_events SET date = ?,timer=? WHERE id = ?",date,time, id)
            else:
                 db.execute("UPDATE table_events SET timer = ? WHERE id = ?",time, id)
            db.execute("UPDATE list_items SET item = ? WHERE id = ?",event, element_id )
            new_element = db.execute("SELECT li.id AS item_id, li.item, li.link, li.star, li.category_id , c.category, c.duration AS category_duration, te.id AS id, te.date AS date, te.timer AS timer, te.event_type, te.period_id, te.frequency ,te.status AS status, te.alarm FROM list_items li JOIN categories c ON li.category_id = c.id LEFT JOIN table_events te ON li.id = te.item_id WHERE te.id = ?",id)
            if link:
                 new_element[0]['hyperlink'] = link
                 new_element[0]['link'] = 1
                 update_links(link,element_id )
            else:
                 new_element[0]['hyperlink'] = ''
                 new_element[0]['link'] = 0
                 db.execute("update list_items set link = 0 where id = ?",element_id)
                 db.execute("DELETE FROM links WHERE item_id = ?", element_id)
     elif update_type == 'delete':
            print(id,update_type)
            item = db.execute("SELECT item_id FROM table_events WHERE id = ?",id)
            db.execute("DELETE FROM table_events WHERE id = ?", id)
            print(item)
            if len(item) > 0 and event_type != 'item' :
                copied =  db.execute("SELECT * FROM table_events WHERE item_id = ?",item[0]['item_id'])
                if len(copied) == 0:
                    db.execute("DELETE FROM list_items WHERE id = ?", item[0]['item_id'])
            return
     else:
         print(f'Error in update_tables: error')
         return

     print('new_elementfun:',new_element)
     return new_element


def get_oldtable_items(days):
    all_items = db.execute("SELECT li.id AS item_id,li.category_id, li.item, li.link, li.star, c.category, c.duration AS category_duration, te.id AS id, te.date AS date, te.timer AS timer, te.event_type,te.color, te.period_id, te.frequency ,te.status AS status, te.alarm, DATE(te.timestamp) AS timestamp FROM list_items li JOIN categories c ON li.category_id = c.id LEFT JOIN table_events te ON li.id = te.item_id WHERE DATE(te.timestamp) <= ? ORDER BY te.timer",max(days))
    items=[]
    for item in all_items:
        n = int(item['frequency'])
        if item['date'] not in days :
            if n == 30:
                item_date = datetime.strptime(item['date'], '%Y-%m-%d').date()
                while (item_date := item_date - relativedelta(months=1)) >= datetime.strptime(item['timestamp'], '%Y-%m-%d').date():
                    print('id',item['id'],datetime.strptime(item['timestamp'], '%Y-%m-%d').date(),item_date)
                    if str(item_date) in days:
                            print(item)
                            item['date'] = str(item_date)
                            items.append(item)
                            break
            elif n != 0 :
                item_date = datetime.strptime(item['date'], '%Y-%m-%d').date()
                while (item_date := item_date - timedelta(days=n)) >= datetime.strptime(item['timestamp'], '%Y-%m-%d').date():
                    print('id',item['id'],datetime.strptime(item['timestamp'], '%Y-%m-%d').date(),item_date)
                    if str(item_date) in days:
                            print(item)
                            item['date'] = str(item_date)
                            items.append(item)
                            break
        else:
            items.append(item)
    return items



def update_goal_values(goal,duration,goal_text,update_date):
    current_end_date = datetime.strptime(update_date, '%Y-%m-%d').date()
    today = datetime.now().date()
    n = int(duration)
    n = 1 if int(duration) == 0 else n
    if n == 30:
        current_start_date =  current_end_date - relativedelta(months=1) + timedelta(days=1)
    else :
        current_start_date  = current_end_date - timedelta(days=(n)) + timedelta(days=1)
    current_goal_period = get_date_range(current_start_date, current_end_date,'totals')
    print('period',current_start_date, current_end_date)
    current = db.execute("SELECT SUM(total) AS sum FROM items_mapping WHERE table_id = ? and date in (?)",goal['table_id'],current_goal_period)
    current = current[0]['sum'] if current else 0
    new_current, new_target = None, None
    type = 'total'
    if goal_text:
            words = re.findall(r'\b(?:average|avg|percentage|percent|total)\b', goal_text, flags=re.IGNORECASE)
            word_types = {'average': 'Avg', 'avg': 'Avg', 'percentage': '%', 'percent': 'Percentage', 'sum': 'Total'}
            type = {word: word_types.get(word.lower(), 'Unknown') for word in words}
            doc = nlp(goal_text)
            for token in doc:
                if token.dep_ in ["nsubj", "dobj"]:
                    try:
                        new_target = float(token.text.replace("$", "").replace(",", ""))
                    except ValueError:
                        new_target =  None
            if type:
                if type == 'avg':
                    new_current_result = db.execute("SELECT AVG(subquery.total_sum) AS avg FROM (SELECT date, SUM(total) AS total_sum FROM items_mapping WHERE table_id = ? AND date IN (?) GROUP BY date) AS subquery", (goal['table_id'], current_goal_period))
                    new_current = new_current_result['avg'] if new_current_result else None
                elif type == 'percentage' and new_target.isdigit():
                    new_target = (float(goal['current']) * float(new_target)) / 100
    current = new_current if new_current is not None else current
    if not current:
        current = 0
    if str(today) in current_goal_period :
         db.execute("update goals set current = ? where table_id = ?",current,goal['table_id'])
    else:
        start = goal['current'] if type == 'percentage' else 0
        target = new_target if new_target is not None else goal['target']
        db.execute("UPDATE goals SET current = ?, start = ?, target = ? WHERE table_id = ?", (current, start, target, goal['table_id']))
    return


def update_dates(user_id):
    print("start update")
    today = datetime.now().date()
    tables = db.execute("SELECT * FROM list_tables WHERE user_id = ?",user_id)
    events = db.execute("SELECT * FROM table_events WHERE event_type ='alarm' and user_id = ?",user_id)
    for table in tables:
        n = int(table['duration'])
        n = 1 if n == 0 and table['type'] == 'calc' else 0
        print(n)
        end_date = datetime.strptime(table['end_date'], '%Y-%m-%d').date()
        start_date = datetime.strptime(table['start_date'], '%Y-%m-%d').date()
        if end_date < today and n != 0:
            if table['type'] == 'calc':
                updated_date = end_date
                if n == 30 :
                    while (updated_date := updated_date + relativedelta(months=1)) < today:
                        pass
                else:
                    while (updated_date := updated_date + timedelta(days=n)) < today:
                        pass
                print(updated_date)
                db.execute("UPDATE list_tables SET end_date =? WHERE id = ?", updated_date,table['id'])
            else:
                 w = 0
                 while end_date <= today :
                    if n == 30 :
                        start_date = start_date + relativedelta(months=1)
                        end_date = end_date + relativedelta(months=1)
                    else:
                        start_date = start_date + timedelta(days=n)
                        end_date = end_date + timedelta(days=n)
                    w+=1
                 print(start_date,end_date)
                 db.execute("UPDATE list_tables SET start_date = ?, end_date=? WHERE id = ?",start_date, end_date,table['id'])
                 if table['type'] == 'table':
                    items = db.execute("SELECT * FROM table_events where period_id in (SELECT id FROM categories WHERE table_id = ?)",table['id'])
                    for item in items:
                        n = int(item['frequency']) * w
                        date = datetime.strptime(item['date'], '%Y-%m-%d').date()
                        if int(item['frequency']) ==30:
                            updated_date = date + relativedelta(months=w)
                        else:
                            updated_date = date + timedelta(days=n)
                        db.execute("UPDATE table_events SET date=? WHERE id = ?", updated_date,item['id'])
    for event in events:
        n = int(event['frequency'])
        print(n)
        updated_date = datetime.strptime(event['date'], '%Y-%m-%d').date()
        if updated_date < today:
            if n == 30 :
                while (updated_date := updated_date + relativedelta(months=1)) < today:
                    pass
            elif n != 0:
                while (updated_date := updated_date + timedelta(days=n)) < today:
                    pass
        db.execute("UPDATE table_events SET date=? WHERE id = ?", updated_date,event['id'])


    print("update sucssesful")
    return

def rest_status(user_id):
     today = datetime.now().date()
     tables = db.execute("SELECT * FROM list_tables where user_id = ?",user_id)
     events = db.execute("SELECT * FROM table_events WHERE event_type ='alarm' and user_id = ?",user_id)
     progress = db.execute("SELECT item_id FROM progress where date = ? and value = 100 and user_id = ?",today,user_id)
     item_ids = [row['item_id'] for row in progress]
     for table in tables:
          date = datetime.strptime(table['start_date'], '%Y-%m-%d').date()
          end_date = datetime.strptime(table['end_date'], '%Y-%m-%d').date()
          if table['type'] == 'todo':
            categories = db.execute("SELECT * FROM categories WHERE table_id = ?",table['id'])
            for category in categories:
                if today == table['start_date'] or today > end_date:
                    db.execute("UPDATE list_items SET status = 0 WHERE category_id = ?",category['id'])
                else:
                    n = int(category['duration'])
                    if n == 30:
                        date = date + relativedelta(months=1)
                    else:
                        date = date + timedelta(days=n)
                    print(n)
                    if today == date or today > end_date:
                        db.execute("UPDATE list_items SET status = 0 WHERE category_id = ? AND id Not in (?)",category['id'],item_ids)
          elif table['type'] == 'calc':
              goal = db.execute("SELECT goals.*, list_tables.goal,list_tables.duration FROM goals JOIN list_tables on list_tables.id = goals.table_id WHERE list_tables.id = ?",table['id'])
              goal = goal[0]if goal else ''
              #update_goal_values(goal,table['duration'],table['goal'],table['end_date'])
          else:
            items = db.execute("SELECT e.* from table_events e JOIN categories c ON e.period_id = c.id WHERE c.table_id = ? and e.item_id not in (?)",table['id'],item_ids)
            for item in items:
                 n = int(item['frequency'])
                 if n == 30:
                    event_date = datetime.strptime(item['date'], '%Y-%m-%d').date() + relativedelta(months=1)
                 elif n != 0:
                    event_date = datetime.strptime(item['date'], '%Y-%m-%d').date() + timedelta(days=n)
                    print('items',event_date,today)
                    if today > end_date or today >= event_date :
                        db.execute("UPDATE table_events SET status = 0 WHERE id = ?",item['id'])
                        item_id = item['item_id']
                        db.execute("UPDATE list_items SET status = 0 WHERE id = ?",item_id)
     for event in events :
          n = int(event['frequency'])
          if n == 30 :
            event_date = datetime.strptime(event['date'], '%Y-%m-%d').date() + relativedelta(months=1)
          elif n != 0:
            event_date = datetime.strptime(event['date'], '%Y-%m-%d').date() + timedelta(days=n)
          if today >= event_date :
            db.execute("UPDATE table_events SET status = 0 WHERE id = ?",event['id'])
            db.execute("UPDATE list_items SET status = 0 WHERE id = ?",event['item_id'])
     print("status reset sucssesful")
     update_dates(user_id)

def update_progress_table(user_id):
     today_date = datetime.now().date()
     today = today_date.strftime('%Y-%m-%d')
     yesterday_date = today_date - timedelta(days=1)
     yesterday = yesterday_date.strftime('%Y-%m-%d')
     global tables, items, events, mains
     tables = db.execute("SELECT * FROM list_tables WHERE user_id = ?",user_id)
     items = db.execute("SELECT * FROM list_items WHERE category_id in (select id from categories where table_id in (select id from list_tables where user_id = ?))",user_id)
     events =  db.execute("SELECT table_events.*, list_items.item FROM table_events JOIN list_items ON table_events.item_id = list_items.id WHERE table_events.user_id = ?",user_id)
     mains = [{'id':0,'item':'main_progress'}]
     progress = db.execute("SELECT * FROM progress")
     types_to_check = ['table', 'item', 'event','main']
     for type_to_check in types_to_check:
         for element in globals()[f'{type_to_check}s']:
             today_entry = next((row for row in progress if row['item_id'] == element['id'] and row['date'] == today and row['type'] == type_to_check), None)
             if not today_entry:
                    yesterday_entry = next((row for row in progress if row['item_id'] == element['id'] and row['date'] == yesterday and row['type'] == type_to_check), None)
                    value = yesterday_entry['value'] if yesterday_entry else 0
                    db.execute("INSERT INTO progress (user_id,type, item_id, value) VALUES (? ,?, ?, ?)",user_id, type_to_check, element['id'],  value)

             print('progress values',today_entry)

def update_tables_progress(id,type,progress):
      today = datetime.now().date()
      db.execute("UPDATE progress SET value = ? WHERE item_id = ? and type = ? and date = ?",progress,id,type,today)
