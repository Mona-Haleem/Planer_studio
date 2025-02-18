//------layout functions--------
function activeCalenderArrows(month,startday){
    const nextButton = document.getElementById("next");
    const previousButton = document.getElementById("previous");
    const calendarContainer = document.getElementById("tiny-calendar-container");
    const calendarHeader = document.getElementById("calendar-header");

    let [currentYear, currentMonthIndex] = month.split("-");
    console.log("Current Month Index:", currentMonthIndex);

    //next arrow data
    const nextMonth = (parseInt(currentMonthIndex) % 12) + 1;
    const nextYear = parseInt(currentYear) + Math.floor((parseInt(currentMonthIndex) ) / 12);
    //previous arrow data
    const prevMonth = (parseInt(currentMonthIndex) - 2 + 12) % 12 + 1;
    const prevYear = parseInt(currentYear) - Math.floor((12 - parseInt(currentMonthIndex)) / 12);

    // get today as the last in calender
    currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // add next arrow event listener
    var isNextMonthAfterCurrent = nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth);
    console.log(isNextMonthAfterCurrent,nextYear,currentYear,nextMonth,currentMonth)
    if (isNextMonthAfterCurrent) {
        nextButton.style.display = "none";
    } else {
        nextButton.style.display = "";
        nextButton.addEventListener("click", function () {
            calendarContainer.innerHTML = "";
            calendarHeader.innerHTML = "";
            console.log(nextYear,nextMonth)
            generateCalendar(`${nextYear}-${nextMonth}`, startday);
        });
    }

    // get startday as 1st calender day
    const parts = startday.split('-');
    const start = parts.slice(0, parts.length - 1).join('-');
    let [startYear, startMonthIndex] = start.split("-");
    startYear = parseInt(startYear) ;
    const startMonth = (parseInt(startMonthIndex));

    // add previous arrow event listener
    var isPrevMonthAfterStart = prevYear < startYear || (prevYear === startYear && prevMonth < startMonth);
    console.log(isPrevMonthAfterStart,prevYear,startYear,prevMonth,startMonth)
    if (isPrevMonthAfterStart) {
        previousButton.style.display = "none";
    } else {
        previousButton.style.display = "";
        previousButton.addEventListener("click", function () {
            calendarContainer.innerHTML = "";
            calendarHeader.innerHTML = "";
            generateCalendar(`${prevYear}-${prevMonth}`, startday);
        });
    }
}

//---map calender and show old progress----
function generateCalendar(month,start) {
    console.log(month,start)
    const calendarContainer = document.getElementById("tiny-calendar-container");
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let currentMonth, currentYear,monthIndex,year;

    // format current data
    if (month) {
        [year, monthIndex] = month.split("-");
        monthIndex = monthIndex - 1
        currentMonth = months[parseInt(monthIndex)];
        currentYear = parseInt(year);
    } else {
        monthIndex = new Date().getMonth()
        currentMonth = months[monthIndex ];
        currentYear = new Date().getFullYear();
        month = `${currentYear}-${monthIndex+1}`;
    }

    //get month days
    const daysInMonth = new Date(currentYear, months.indexOf(currentMonth) + 1, 0).getDate();
    const header = document.getElementById("calendar-header");
    header.textContent = `${currentMonth} ${currentYear}`;

    activeCalenderArrows(month,start)

    //header weekdays
    const daysOfWeek = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
    daysOfWeek.forEach(day => {
        const dayLabel = document.createElement("div");
        dayLabel.classList.add("calendar-day");
        dayLabel.textContent = day;
        calendarContainer.appendChild(dayLabel);
    });

    // map the days:

    // leave empty space util the 1st day weekday
    const firstDayOfWeekIndex = new Date(`${currentYear}-${currentMonth}-01`).getDay();
    if (firstDayOfWeekIndex != 6){
        for (let i = 0; i < firstDayOfWeekIndex+1; i++) {
            const emptyDay = document.createElement("div");
            emptyDay.classList.add("calendar-day");
            calendarContainer.appendChild(emptyDay);
        }
    }
    const progressBar = document.getElementById("progress_bar");
    const Title = document.title;
    page = Title.split(' ')[1];
    //add day by day
    for (let day = 1; day <= daysInMonth; day++) {
        const calendarDay = document.createElement("div");
        calendarDay.classList.add("calendar-day");
        calendarDay.textContent = day;

        // Highlight the current day
        if (day === new Date().getDate() && monthIndex === new Date().getMonth()) {
            calendarDay.classList.add("current-day");
        }

        //check if day is betweeen user register date and today
        const currentDate = new Date(`${currentYear}-${monthIndex+1}-${day}`);
        if (currentDate.setHours(0, 0, 0, 0) >= new Date(start).setHours(0, 0, 0, 0) && currentDate.setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0)) {
            if (progressBar || page == 'Events'){
                // add onclick event to each day to load the old progress on that day
                calendarDay.setAttribute("onclick", `handleDayClick(${day})`);

                calendarDay.onclick = function() {
                    // Remove the 'selected' class from previously selected day, if any
                    const previousSelectedDay = document.querySelector('.selected');
                    if (previousSelectedDay) {
                        previousSelectedDay.classList.remove('selected');
                    }
                    // reset items status
                    var checkboxs = $('[id$="_status"]');
                    checkboxs.each(function () {
                        if (this && this.type === 'checkbox') {
                            this.checked = this.value === '1';
                        }
                    });

                    var elements = $('[id$="_item_container"]');
                    if (elements.length === 0) {
                        elements = $('[id$="_alarm_temp"]');
                    }
                    elements.each(function() {
                        $(this).css('backgroundColor', '');
                    });

                    // Add the 'selected' class to the clicked day
                    calendarDay.classList.add('selected');
                    const selectedDate = new Date(Date.UTC(currentYear, monthIndex, day));
                    console.log(selectedDate,currentYear, monthIndex, day)
                    const formattedDate = selectedDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                    console.log(selectedDate,formattedDate)
                    const urlParams = new URLSearchParams(window.location.search);
                    const itemValue = urlParams.get('item');

                    const data = {
                        page: page,
                        selectedDate: formattedDate,
                        item: itemValue,
                    };
                    console.log(data);

                    fetch('/progress', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        document.getElementById('readonly').style.display='';
                        document.getElementById('endTutorial').style.display='';
                        var exitButton = document.getElementById('exitTutorialButton');
                        if (exitButton){
                            exitButton.addEventListener('click', function() {
                                //location.reload();
                            });
                        }
                        //disableFunctions
                        remove = function() {};
                        updateselection = function() {};
                        addItemButtonsEvents = function() { };
                        submitForm = function() {};
                        showForm = function(){};

                        if (page !== 'Events'){
                            document.querySelector('#progress_bar progress').value = data.progress;
                            if (page === 'Home'){
                                const chosen_date = new Date(`${currentYear}-${monthIndex+1}-${day}`).toISOString().slice(0, 10);
                                Generate_main_table(chosen_date,data.selected_day);
                            }else if (page !== 'Calculator'){
                               data.items.forEach(function (item) {
                                const checkboxElement = document.getElementById(`${item.id}_status`);
                                if (checkboxElement && checkboxElement.type === 'checkbox') {
                                        checkboxElement.checked = item.status === 100;
                                    }
                                });
                            }
                        }
                        if (page !== 'Calculator' ){
                            if (page !== 'Home'){
                                check_completion(data.items)
                            }
                        }else{
                            const form = document.getElementById('display');
                            form.addEventListener('change', function() {
                                getFormValues(data.month_data,itemValue);
                            });
                            getFormValues(data.month_data,itemValue);
                            update_numbers(formattedDate,'N',itemValue,'total_log');
                        }

                    })
                    .catch(error => console.error(error));
                };
            }
        }else if (currentDate < new Date(start)){
            calendarDay.style.color = '#999';
        }
        calendarContainer.appendChild(calendarDay);
    }
 }

 function add_date_check_progrees_event(){
    return;
 }
 //------------------------------------------------------------------------------------------------
 function checkAlarms(alarms) {
    let now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    now = `${hours}:${minutes}`;
    console.log(now);
    for (const alarm of alarms) {
        if (alarm.timer ===  now ) {
            console.log('sucsses');
            document.getElementById('gifContainer').style.display='';
            var speechBubble = document.getElementById('speechBubble2');
            var message = "it's time for " + alarm.item;
            play_alarm(message,115)
            speechBubble.addEventListener('click', function (event) {
                toggleState(event, 'status', 0, 'events', alarm);
                toggleState(event, 'alarm', 1, 'events', alarm);
                document.getElementById('gifContainer').style.display='none';
                speechBubble.style.display='none';
                alarms = alarms.filter(a => a !== alarm);
            });
            setTimeout(() => {
                document.getElementById('gifContainer').style.display='none';
                speechBubble.style.display='none';
            }, 7000);
        console.log('Alarm matched for ' + alarm.item);
        }
     }
   }
   function check_tables(end_tables){
    var good_job_message, bad_job_message;
    var messages =[];
    messages.push({'messege':' today is the limit for this tables ','gif':1})
    for (const table of end_tables) {
        var expected_progress = Math.round(100 * (Number(table.duration) - 1) / Number(table.duration), 2);
        if (Number(table.progress) >= expected_progress){
                good_job_message = table.title + ', ' + good_job_message ;
        }else{
                bad_job_message = table.title + ', ' + bad_job_message;
                console.log(bad_job_message)
        }
    }
    if (good_job_message){
        messages.push({'messege':good_job_message,'gif':1})
        messages.push({'messege':'you are doing greet keep it up','gif':1})
        if (bad_job_message){
            messages.push({'messege':'keep it up ,but','gif':1});
        }
    }
    if (bad_job_message){
        messages.push({'messege':'you need to try harder here','gif':1});
        messages.push({'messege':bad_job_message,'gif':1});
    }

    var duration = 3500;

    for (const message of messages) {
        setTimeout(() => {
            document.getElementById('gifContainer').style.display='';
            play_alarm( message.messege,message.gif );
            console.log(duration)
        },duration)
        duration += 3500;
    }
    setTimeout(() => {
            var speechBubble = document.getElementById('speechBubble2');
            document.getElementById('gifContainer').style.display='none';
            speechBubble.style.display='none';
        }, duration);
    console.log(messages)
}
function  play_alarm(message,gif) {
console.log(message)
document.getElementById("kitty-gifs").src =`/static/gifs/${gif}.gif`;
var speechBubble = document.getElementById('speechBubble2');
speechBubble.textContent = message;
speechBubble.style.display = '';
speechBubble.style.marginTop = '45%';
speechBubble.style.fontSize = '20px';
speechBubble.style.marginLeft = '-21%';
speechBubble.style.width = '19%';
speechBubble.style.backgroundColor = 'rgba(240,200,43,0.5)';
}

//--------------------------------------------------------------------------------------------------
//---play gifs----
function showNextGif(gifs,currentGifIndex) {
    console.log('playing gif ',currentGifIndex)
    const currentGif = gifs[currentGifIndex];
    const gifElement = document.getElementById('kitty-gifs');
    gifElement.src = currentGif;

    // Increment the index for the next gif
    currentGifIndex = (currentGifIndex + 1) % (gifs.length);
    // Wait for 10 seconds and then show the next gif
     setTimeout(() => showNextGif(gifs, currentGifIndex), 100000);


}
//-----------------------------------------------------------------------------------------------------
//----show hide gifs----
function toggleGifContainer() {
    const showKittyRadio = document.getElementById('showKitty');
    const gifContainer = document.getElementById('gifContainer');

    if (showKittyRadio.checked) {
        gifContainer.style.display = 'block';
        const gifs = ['/static/gifs/1.gif','/static/gifs/2.gif','/static/gifs/3.gif','/static/gifs/4.gif','/static/gifs/5.gif','/static/gifs/6.gif','/static/gifs/7.gif','/static/gifs/8.gif','/static/gifs/9.gif','/static/gifs/10.gif','/static/gifs/11.gif','/static/gifs/12.gif','/static/gifs/13.gif','/static/gifs/14.gif','/static/gifs/15.gif'];
    let currentGifIndex = 0;
        showNextGif(gifs, currentGifIndex, gifContainer);
    } else {
        gifContainer.style.display = 'none';
    }
}
 //---------------------------------------------------------------------------------------------------------
function setBackgroundUrl(n) {
    var currentImageUrl = `/static/backgrounds/${n}.jpg`;
    console.log('img set to url' + `/backgrounds/${n}.jpg`)
    localStorage.setItem('backgroundUrl',currentImageUrl );
    setbackground()
    }

function setbackground(){
    var backgroundContainer = document.querySelector('.background-container');
    var storedImageUrl = localStorage.getItem('backgroundUrl');
    if (!storedImageUrl){
        storedImageUrl ='/static/backgrounds/1.jpg'
    }
    backgroundContainer.style.backgroundImage = 'url("' + storedImageUrl + '")';
    console.log('img set to url' + `/static/backgrounds/${storedImageUrl}.jpg`)
}

function setColors(index) {
    var colorList = [
        {'--primary-color': '#22242E','--secondary-color': '#383A47','--headers':'#F0CA65','--calender':'#7683B0','--calender-light':' #9B9075','--title':'#0D6EFD','--subtitle':'#6AA9F5','--itemborder':'#ccc','--table-row':'#7F8DE3','--table-head':'#575E8B','--acordionbody':'rgba(242, 209, 126,0.2)}'},
        {'--primary-color': '#1E1E1E','--secondary-color': '#142F1E','--headers': '#97182A','--calender': '#263238','--calender-light':'#757575','--title':'#97182A','--subtitle': '#757575','--itemborder': '#B0BEC5','--table-row':'#8A93C3','--table-head':'#4D546F','--acordionbody':'rgba(209, 198, 165, 0.2)' },
        {'--primary-color': '#E0E0E0','--secondary-color': '#F5F5F5','--headers':'#495057','--calender':'#D1D5E1','--calender-light':' #B0B4C2','--title':'#0D6EFD','--subtitle':'#6AA9F5','--itemborder':'#efefef','--table-row':'#A7A7A7','--table-head':'#757575' ,'--acordionbody': 'rgba(244, 233, 199, 0.2)'},
        {'--primary-color': '#022948','--secondary-color': '#27678C','--headers':'#1E90FF','--calender':'#4682B4','--calender-light': '#5F9EA0','--title':'#6495ED','--subtitle':'#00CED1','--itemborder':'#efefef','--table-row':'#87A3BF','--table-head':'#547294' ,'--acordionbody':'rgba(209, 221, 242, 0.2)' },
        {'--primary-color': '#D2B48C','--secondary-color': '#F5F5DC','--headers':'#8B4513','--calender':'#CD853F','--calender-light':' #DEB887','--title':'#0D6EFD','--subtitle':'#6AA9F5','--itemborder':'#efefef','--table-row':'#B49D7E','--table-head': '#7D6954' ,'--acordionbody': 'rgba(242, 230, 209, 0.2)' },
        {'--primary-color': '#C9538E','--secondary-color': '#FFB6C1','--headers':'#FF1493','--calender':'#FFC0CB','--calender-light': '#FFD700','--title':'#FF00FF','--subtitle':'#DA70D6','--itemborder':'#efefef','--table-row':'#7D6954' ,'--table-head': '#784659','--acordionbody': 'rgba(242, 209, 219, 0.2)'},
        {'--primary-color': '#808080','--secondary-color': '#A9A9A9','--headers':'#C0C0C0','--calender':'#D3D3D3','--calender-light': '#DCDCDC','--title':'#696969','--subtitle':'#778899','--itemborder':'#efefef','--table-row':'#B28192','--table-head':'#606060','--acordionbody':'rgba(209, 209, 209, 0.2)'}
    ];
    var storedIndex = localStorage.getItem('selectedColorIndex');
    var selectedColors = colorList[index];
    // Update CSS variables with the selected colors
    for (var key in selectedColors) {
        if (selectedColors.hasOwnProperty(key)) {
            document.documentElement.style.setProperty(key, selectedColors[key]);
        }
    }
}

function setThema(index){
    // Save the selected index to localStorage
    localStorage.setItem('selectedColorIndex', index);
    setColors(index !== null ? parseInt(index, 10) : 0);
}

let n = 0;
function update() {
    setColors(n);
    setBackgroundUrl(n);
    n += 1;
}