//-----------------------------------------------common functions----------------------------------------------------------------------
//toggel elements
function toggle(id) {
    const inputField = document.getElementById(id);
    if (inputField.style.display === 'none') {
        inputField.style.display = '';
    } else {
        inputField.style.display = 'none';
    }
};

function toggleInput(editbuttonId,formID) {
    var inputField = document.getElementById(formID);
    var Button = document.getElementById(editbuttonId);
    if (inputField.style.display === 'none' || inputField.style.display === '') {
        inputField.style.display = 'block';
        Button.style.display = 'none';
    } else {
        inputField.style.display = 'none';
        Button.style.display = 'block';
    }
}
//----------------------------------------------------------------------------
// toggel form
function showForm(elementOverlay) {
    const overlay = document.getElementById(elementOverlay);
    overlay.style.display = 'flex';
    // Add event listener to close the form when clicking outside it
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
            hideForm(elementOverlay);
        }
    });
}

function hideForm(elementOverlay) {
document.getElementById(elementOverlay).style.display = 'none';
}
//-----------------------------------------------------------------------------
function check_completion(items){
    // Get today's date in the format 'yy-mm-dd'
    console.log(items)
    const today = new Date().toISOString().slice(0, 10);

    // Get the current time in the format 'hh:mm'
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });

    console.log('Today:', today);
    console.log('Now:', now);
    items.forEach(item => {
         // Check if the item's date and time are less than now
        if ((item.date < today)||((!item.date ||item.date < today) && (!item.timer || item.timer < now))) {
            // Get the element by id
            var element = document.getElementById(item.id+'_item_container');
            if (!element){
                element = document.getElementById(item.id+'_alarm_temp');
            }
            if (element){
                // Check the status and set the background color accordingly
                if (item.status === 1 || item.status === 100) {
                    element.style.backgroundColor = '#77F2AE';
                } else {
                    element.style.backgroundColor = "#F58C82";
                }
            }
        }
    });
}
//------------------------------------------------------------------------------
// delete elment
function remove(rowId, item_id,type) {
    console.log('Server response:', type);
    var row = document.getElementById(rowId);
    if (type == 'period') {
        // Extract the prefix from the rowId
        var prefix = rowId.split('_')[0]; // Assuming your IDs are separated by underscores
        // Select all elements whose id starts with the extracted prefix
        const elements = document.querySelectorAll(`[id^="${prefix}_period"]`);
        // Hide each selected element
        elements.forEach(element => {
            element.style.display = 'none';
        });
    }
    if (row) {
        console.log('Server response:', 'hide');
        row.style.display = 'none';
        console.log('Server response:', row.style.display);
        row.remove();
    }
    // Send item_id to Flask
    fetch('/delete_element', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            item_id: item_id,
            type: type,
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('deleted from flask');
        if (type === 'table_event') {
            console.log(rowId.split('_')[0])
            getnewspans(rowId.split('_')[0],'period');
        }else if (type === 'period'){
            getnewspans(rowId.split('_')[0],'noperiod');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//----------------------------------------------- check selection ----------------------------------------------------------------------
// update selection
function updateselection(selected, elmentId, elmentType) {
    if(elmentType === 'table'){
          calculateEndDate();
          return;
     }else if(elmentType === 'MainTableDays'){
        Generate_main_table();
        return;
     }else if(elmentType === 'addalarm'){
          return;
     }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/update_selection', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            } else {
                console.error('Error:', xhr.status, xhr.statusText);
            }
        }
    };
    // Send the selected duration, category name, and title to the server
    xhr.send(JSON.stringify({
        duration: selected,
        id: elmentId,
        type: elmentType
    }));
    }


function checkCustomOption(selectElement,InputId, elmentType) {
    const ElmenetId = InputId.split('_')[0];
    const div = document.getElementById(InputId+'_div');
    const inputElement = document.getElementById(InputId);
    var customValue = selectElement.value
    console.log(selectElement, inputElement, customValue);

    if (selectElement.value === 'temp') {
        div.style.display = 'inline-block';
        console.log(ElmenetId+'_selectbtn');
        document.getElementById(ElmenetId+'_selectbtn').addEventListener('click', function () {
            div.style.display = 'none';
            customValue = inputElement.value;
            console.log(customValue);

            // Edit the HTML string to set the value and make the option selected
            var selectHtml = selectElement.outerHTML;
            selectHtml = selectHtml.replace(`value="${selectElement.value}"`, `value="${customValue}" selected`);
            selectElement.outerHTML = selectHtml;
            console.log(selectHtml);
            console.log('Updated value:', customValue);
            updateselection(customValue, ElmenetId, elmentType);
     });
    } else {
        div.style.display = 'none';
        var options = selectElement.options;
        if (options.length > 0 && options[options.length - 1].value !== 'temp') {
             options[options.length - 1].value = 'temp';

        }
        updateselection(customValue, ElmenetId, elmentType)

    }
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//set status
function setImageSource(button, state,type) {
    if (button){
        var currentSrc = button.src;
        var newIconNumber;
        switch (type) {
            case 'link':
                newIconNumber = state === 0 ? '01' : '11';
                break;
            case 'alarm':
                newIconNumber = state === 0 ? '02' : '12';
                break;
            case 'star':
                newIconNumber = state === 0 ? '03' : '13';
                break;
        }
        button.src =`/static/icons/${newIconNumber}.png`;
    }
}
function setState(item,links){
    console.log(item)
    var status_button = document.getElementById(item.id + '_status');
    var alarm_button = document.getElementById(item.id + '_alarm');
    var link_button = document.getElementById(item.id + '_link');
    var star_button = document.getElementById(item.id + '_star');
    console.log(status_button)
    status_button.checked = item.status === 1;
    setImageSource(alarm_button, item.alarm,'alarm');
    setImageSource(link_button, item.link,'link');
    setImageSource(star_button, item.star,'star');
    if (item.link === 1) {
        // Assuming links is an array of link objects
        var link = links.find(link => link.item_id === item.id);
        if (!link){
            link = links.find(link => link.item_id === item.item_id);
        }
        if (link) {
            var linkElement = document.getElementById(item.id + '_hyperlink');
            // Check if the link element exists
            if (linkElement) {
                // Replace the href attribute with the new link
                linkElement.href = link['link'] ;
            }
        }
    }
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// add buttons events and functions

function toggleState(event, type,item_status,table,item) {
    console.log('Initial item_status:', item_status);
    // Toggle the state based on the provided type
        item_status = item_status == 1 ? 0 : 1;
        console.log('Toggled item_status:', item_status);
        var id ;
        // Update the button style based on the new state
        if (type === 'link'){
            id = item['item_id'];
        }else{
            id = item['id'];
        }
        var buttonId = id + '_' + type  ;
        var button = document.getElementById(buttonId);
        if(!button){
            var buttonId = item['id'] + '_' + type  ;
            var button = document.getElementById(buttonId);
           }
        if (type === 'alarm'){
          if(!button){
            id = item['item_id'];
            var buttonId = id + '_' + type  ;
            var button = document.getElementById(buttonId);
           }
        }
        if (table === 'events' && type === 'star'){
            id = item['item_id'];
        }
        console.log(button,buttonId)


         // Send the updated state to Flask
        fetch('/toggel_items_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: id,
                newState: item_status,
                type: type,
                table:table,
            }), // Close the body object properly
        }).then(response => response.json())
        .then(data => {
            console.log('Status:', data.status);
             console.log('New State:', data.newState);
             setImageSource(button, data.newState, type);

              // Update the status in the items dictionary in HTML
              item[type] = data.newState;
        })
        .catch(error => {
            console.error('Failed to update item status');
        });
}
                                        //----------------------------------------
//add buttons event listener
function addItemButtonsEvents(item,type) {
    if (type !== 'alarm'){
        // Add status event
        var statusCheckbox = document.getElementById(item['id'] + '_status');
        statusCheckbox.addEventListener('change', function (event) {
            toggleState(event, 'status', item['status'], type, item);
            var checkboxes = document.querySelectorAll('[id$="_status"]');
            var numberOfCheckboxes = checkboxes.length;
            var checkedCount = 0;

            checkboxes.forEach(function (checkbox) {
                if (checkbox.checked) {
                    checkedCount++;
                }
            });

            var progress = (checkedCount / numberOfCheckboxes) * 100;
            document.querySelector('#progress_bar progress').value = progress;
        });
        // Add add star event
        var starButton = document.getElementById(item['id'] + '_star_btn');
        if (starButton){
            starButton.addEventListener('click', function (event) {
               toggleState(event, 'star', item['star'], type, item);
            });
        }
    }
    //add alarm event
    var alarmButton = document.getElementById(item['id'] + '_alarm_btn');
    if (type === 'item' ){
        var alarmInput = document.getElementById('event_item_id');
        var alarmname = document.getElementById('eventName');
    }
    if (alarmButton){
        alarmButton.addEventListener('click', function (event) {
            //check alarms existance
            if (type === 'item' ){
            console.log('Alarms:', alarms);
            console.log('Item ID:', item['id']);
            var alarmExists = alarms.some(alarm => alarm['item_id'] == item['id']);
            console.log('Alarm Exists:', alarmExists);
            }
            if (type !== 'item' || (type == 'item' && alarmExists)) {
                toggleState(event, 'alarm', item['alarm'], type, item);
            } else {
                alarmname.value = item['item'];
                alarmInput.value = item['id'];
                showForm('overlay_alarm');
            }
        });
    }
    if (type === 'item'){
        addItemExtraButtons(item);
    }else if (type === 'events'){
        addEventsExtraButtons(item);
    }else{
        addAlarmExtraButtons(item);
    }
}

                                        //----------------------------------------

 function addItemExtraButtons(item){
    // Get the link button element
    var linkButton = document.getElementById(item['id'] + '_link_btn');
    var linkInput = document.getElementById('link_item_id');
    // Add event  for the link button
    if (linkButton){
        linkButton.addEventListener('click', function (event) {
            console.log('Links:', current_links);
            console.log('Item ID:', item['id']);
            //check link existance
            var linkExists = current_links.some(link => link['item_id'] == item['id']);
            console.log('Link Exists:', linkExists);
            if (linkExists) {
                console.log('delete');
                editlink(event,'delete',item['id'])
            } else {
                console.log('add');
                linkInput.value = item['id'];
                showForm('overlay_link');
            }
        });
    }
 }

                                         //----------------------------------------

function addAlarmExtraButtons(alarm){
    // Add event for the edit button
    var editButton = document.getElementById(alarm['id'] + '_edit_btn');
    editButton.addEventListener('click', function (event) {
        console.log(document.getElementById('alarm_id'),alarm.id)
        document.getElementById('alarm_id').value = alarm.id
        document.getElementById('edit_Timer').value = convertToHHMMFormat(alarm.timer)
        document.getElementById('edit_Date').value = alarm.date
        document.getElementById('edit_eventName').value = alarm.item
        document.getElementById('alarm_item_id').value = alarm.item_id
        document.getElementById('edit_linkvalue').value = document.getElementById(alarm['id']+'_hyperlink').value
        showForm('overlay_edit_event')
    });
}

                                        //----------------------------------------

function addEventsExtraButtons(item){
    // Add event for the edit button
    var editButton = document.getElementById(item['id'] + '_edit_btn');
    if ( editButton ){
    editButton.addEventListener('click', function (event) {
        document.getElementById('event_id').value = item.id
        document.getElementById('edit_Timer').value = convertToHHMMFormat(item.timer)
        document.getElementById('edit_eventName').value = item.item
        document.getElementById('event_item_id').value = item.item_id
        var url= document.getElementById(`${item.id}_hyperlink`).href;
        if (url && url !=''){
        var path =(new URL(url)).pathname + (new URL(url)).search
        document.getElementById('edit_linkvalue').value =`${path}`;
        console.log(path,document.getElementById('edit_linkvalue').value)
        }
        var startTime = document.getElementById(`${item.period_id}_timer_start`);
        var endTime = document.getElementById(`${item.period_id}_timer_end`);

        if (startTime && endTime) {
            startTime = startTime.textContent.trim();
            endTime = endTime.textContent.trim();
        } else {
            var time = document.getElementById(`${item.period_id}_timer`).textContent.split('to').map(str => str.trim());
            console.log(time);
        }

        document.getElementById('edit_Timer').min = convertToHHMMFormat(startTime);
        document.getElementById('edit_Timer').max =  convertToHHMMFormat(endTime);

        showForm('overlay_edit_event')
    });
    }
    // Add delete event
    var parentdiv = item.period_id + '_period_' + item.date + '-' + item.id;
    var deletebtn = document.getElementById(item['id'] + '_remove');
    deletebtn.addEventListener('click', function (event) {
        remove(parentdiv, item['id'], 'table_event');

    });

    var linkButton = document.getElementById(item['id'] + '_link_btn');
    var hyperlink = document.getElementById(item['id'] + '_hyperlink');
    var expandButton = document.getElementById(item['id'] + '_expand_btn');
    var category_items = document.getElementById(item['id'] + '_category_items');
    console.log(linkButton,expandButton)
    // Add link event
    if (hyperlink.href === '') {
        console.log('removelink')
        if(linkButton){
            linkButton.remove();
        }
    } else {
        if (!linkButton){
            console.log('loadlink')
            load_element('link_btn',item,`${item.id}_toggel`)
            linkButton = document.getElementById(item['id'] + '_link_btn');
        }
        linkButton.addEventListener('click', function (event) {
            toggleState(event, 'link', item['link'], 'item', item);
            if (item['link'] === 0) {
                if (item['event_type'] === 'item'){
                    linkButton.style.display ='none'
                    hyperlink.href === ''
                }
                hyperlink.removeEventListener('click',function (event) {event.preventDefault();});
                hyperlink.addEventListener('click', function (event) { window.location.href = hyperlink.href;});
            } else {
                hyperlink.removeEventListener('click',function (event) {window.location.href = hyperlink.href;});
                hyperlink.addEventListener('click', function (event) { event.preventDefault();});
            }
        });
    }
    // Add category event
    if (item['event_type'] === 'category'){
       expandButton.addEventListener('click', function (event) {
            const itemCount = category_items.childElementCount;
            console.log(itemCount)
            if (itemCount > 1){
                toggleInput(item['id'] + '_category_items',item['id'] +'_text')
                toggle(item['id'] +'_timer');
            }else{
                document.getElementById(item['id'] +'_text').style.display='none';
                document.getElementById(item['id'] +'_timer').style.display='none';
                expandCategory(item['category_id'],item['id'])
            }
            console.log('expand')
        });
    }else{
        if(expandButton && category_items){
            category_items.remove()
            expandButton.remove();
        }
    }
}
//--------------------------------------------------------------------------
function addCalcEvntButtons(type,data,newrowId){
    if (type === 'category_accordion_temp'){
        var addButton = document.getElementById(`${data.id}_additem`);
        if (addButton) {
        addButton.addEventListener('click', function () {
            console.log(`${data.id}_category_id`,data.category_id)
            document.getElementById(`${data.id}_category_id`).value =data.id.split('-')[0];
            });
        }
        var deleteButton = document.getElementById(`${data.id}_delete_btn`);
        if (deleteButton) {
            deleteButton.addEventListener('click', function () {
                 remove(newrowId, data.id.split('-')[0],'calc_category')
                });
         }
    }else if (type === 'calc_item_temp'){
        var deleteButton = document.getElementById(`${data.category_id}_delete_btn`);
        if (deleteButton) {
            deleteButton.addEventListener('click', function () {
                remove(newrowId, data.id,'calc_item')
            });
        }
}
}
//---------------------------------------------------------------------
function editlink(event,type,itemId){
    console.log('current_links:', current_links);
    var data;
    var linkitemId;
    if (type == 'add'){
    event.preventDefault();
     // Get values from the form
     var selectElement = document.getElementById('linkvalue');
     var linkitemId = document.getElementById('link_item_id').value;
     var link = selectElement.value;
     var selectedOption = selectElement.options[selectElement.selectedIndex];
        if (selectedOption) {
           var tableId = selectedOption.getAttribute('data-table-id')
           console.log('selectElement',selectElement);
           console.log('item_id',linkitemId);
           console.log('link',link);
           console.log('selectedOption',selectedOption);
           console.log('Selected Table ID:', tableId);
           // Make an AJAX request to a Flask route
           data = { 'table_id': tableId, 'link':link, 'item_id':linkitemId,'type':'add' };
        }
    }else{
        linkitemId = itemId;
        if (itemId.lenght > 1){
            linkitemId = itemid[0]
        }
        data = {'item_id':linkitemId,'type':'delete'}
    }
        $.ajax({
            type: 'POST',
            url: '/editlink',  // Replace with your Flask route
            contentType: 'application/json',  // Add this line to set the Content-Type
            data: JSON.stringify({ 'linkdata': data }),
            success: function(response) {
                console.log('Server response:', response);

                // Handle the response data as needed
                if (response.status === 'success') {
                    if (itemId.lenght > 1){
                        linkitemId = itemid[1]
                    }
                    var linkElement = document.getElementById(linkitemId+'_hyperlink');
                    data=response.newlink[0];
                    if (linkElement) {
                        if (type === 'add'){
                        // Replace the href attribute with the new link
                        linkElement.href = link;
                        toggleState(event, 'link', 0, 'item', data)
                        current_links.push(data);
                        }else{
                            linkElement.href = '#' ;
                            toggleState(event, 'link', 1, 'item', data)
                            current_links = current_links.filter(function(link) {
                                return link.item_id !== linkitemId;
                            });
                        }
                } else {
                    alert('Server error: ' + response.message);
                }
                console.log('current_links:', current_links);
            }
           else {
                console.error('Error:', error);
            }
        }
        });
    }

//----------------------------------------------------------------------------------------------------
function expandCategory(categoryId,eventId) {
    // Prepare the data to send
    const data = {
        category_id: categoryId
    };
    fetch('/get_category_items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);
        const parentDivId = `${eventId}_category_items`;
        if (data.items.length > 0){
        data.items.forEach(item => {
            load_element('item_temp', item, parentDivId);
            setState(item, item.hyperlink);
            addItemButtonsEvents(item,'item');
        });
    }else{
        item ={'id':0,'item':"this event has no items"}
        load_element('text', item, parentDivId);
    }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// retrive the html structure of the desired element
function retrieveHTML(Id) {
    // Find the element by ID
   const element = document.getElementById(Id);
   if (element) {
       console.log('found',Id);
       return element;
   } else {
       console.error(`Element with ID '${Id}' not found.`);
   }
}
                           //----------------------------------------------------------------------------------------------------------------------------------------------------------------
// change the elemnts id
function changeElementIds(oldId, newId,element) {
    if (element) {
        console.log(`${oldId}, ${newId}, ${element.outerHTML}`);
        const newHtml = element.outerHTML.replace(new RegExp(oldId, 'g'), newId);
        console.log(newHtml);
        return newHtml; // Add this line
    } else {
        console.error(`Element with ID '${element}' not found.`);
    }
}
                           //----------------------------------------------------------------------------------------------------------------------------------------------------------------
// Function to check if a string is in time format
function isTimeString(str) {
    const timeRegex = /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(str);
}

//format time to 12h format
function formatTime(timeString) {
    // Parse the time string and format to hours, minutes, AM/PM
    const parsedTime = new Date('2021-01-01 ' + timeString);
    const formattedTime = parsedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return formattedTime;
}

// update the values
function updateHTML(data,elementId) {
    let htmlContent = retrieveHTML(elementId);
    // get the id
    const Id = elementId.split('_')[0];
    console.log(Id);
    // Loop through the data and update corresponding HTML elements
    if (htmlContent) {
            for (const key in data) {
                const regex = new RegExp(`{{${Id}_${key}}}`, 'g');
            if (regex) {
                if (isTimeString(data[key])) {
                    // Check if data is a time string and format it to 12-hour system
                    data[key] = formatTime(data[key]);
                }
                // Check if the element is a select
                const targetElement = document.getElementById(`${Id}_${key}`);
                if (targetElement) {
                    // Check if the element is a select
                    if (targetElement.tagName === 'SELECT') {
                        let option;
                        if (data[key] === 'daily') {
                            option = targetElement.querySelector(`option[value='1']`);
                        } else {
                            option = targetElement.querySelector(`option[value="${data[key]}"]`);
                        }

                        if (option) {
                            option.selected = true;
                        } else {
                            console.warn(`Option with value "${data[key]}" not found in the select element.`);
                            const customOption = targetElement.querySelector('option[value="temp"]');
                            if (customOption) {
                                customOption.selected = true;
                            } else {
                                console.error('Option labeled "custom" not found in the select element.');
                            }
                        }

                    } else if (targetElement.tagName === 'INPUT') {
                        // Check if the element is an input
                        targetElement.value = data[key];
                    } else if (targetElement.tagName === 'A') {
                        targetElement.href = data[key];
                    } else {
                        // For other elements, replace as usual
                        console.log(data[key], regex);
                        console.log(targetElement);
                       // Use innerHTML if data[key] contains HTML markup
                        targetElement.innerHTML = data[key];
                        console.log(targetElement);
                    }
                } else {
                    console.warn(`Element with ID ${Id}_${key} not found.`);
                }
            }
        }
    }
}

//------------------------------------------------------------------------------------------------------------------
//load elements
function load_element(type,data,parentDivId){
    let templatId = 'N';
    let rowId = `N_${type}`;
    const template = retrieveHTML(rowId);
    const element = changeElementIds(templatId, data.id, template);
    const parentDiv = document.getElementById(parentDivId);
    console.log(parentDiv)
    if (parentDiv) {
        if (type === 'table_event_temp' ) {
            insertCellAfter(parentDivId, element,data)
        }else{
        parentDiv.insertAdjacentHTML('beforeend', element);
        }
        console.log('Server response:', 'append sucsses');
    }
    let newrowId = `${data.id}_${type}`;
    console.log('Server response:', newrowId);
    updateHTML(data,newrowId);
    addCalcEvntButtons(type,data,newrowId)
    console.log(type)
    if (type === 'category_accordion_temp'){

    if (Number(data.factor) === 1){
        console.log(data.factor)
        document.getElementById(data.id +'_sign').style.backgroundColor='#212529'
    }else{
        console.log(data.factor)
        document.getElementById(data.id +'_sign').style.backgroundColor='#E6663E'
    }
  }
}

//------------------------------------------------------------------------------------------------------------------
//validate form
function validateForm(formId) {
    const form = document.getElementById(formId);
    const requiredFields = form.querySelectorAll('[required]');
    const textFields = form.querySelectorAll('input[type="text"]');

    let isValid = true;
    // Check for invalid characters in text input fields
    textFields.forEach(field => {
        if (field.value.includes("'") || field.value.includes('"')) {
            isValid = false;
            // Optionally, you can add an error message or styling here
            console.error(`Field ${field.name} contains invalid characters.`);
        }
    });
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            // Optionally, you can add an error message or styling here
            console.error(`Field ${field.name} is required.`);
        }
    });
    return isValid;
}

                              //----------------------------------------------------------------------------------------------------------------------------------------------------------------
// submit the form and get it's data
function submitForm(event,updateType, elementType,formId,parentDivId,callback) {
    event.preventDefault();
    //const templatId = 'N'
    console.log(updateType, elementType,formId,parentDivId);
    // Validate the form
    if (!validateForm(formId)) {
        // Form is not valid, do not proceed with submission
        return false;
    }

    // Collect form data
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    console.log(Object.fromEntries(formData.entries()));
    // Add additional parameters as JSON
    formData.append('updateType', updateType);
    formData.append('elementType', elementType);
    console.log('Update Type:', updateType);
    console.log('Element Type:', elementType);

    fetch('/update_element', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);
        newdata = data.data[0]
        console.log('Server response:', newdata);

        // creat the new element based on the original template
        if (updateType === 'create') {
            if (elementType === 'period'){
                console.log(data.data)
                loadtableperiod(data.data);
                return
            }else if (parentDivId === 'index_event'){
                return
            }
            if (elementType === 'alarm' && parentDivId === 'none'){
                toggleState(event, 'alarm', 0, 'item', newdata)
                alarms.push(newdata);
                return;
            }
            let type = `${elementType}_temp`;
            if (elementType === 'category_accordion'){
                newdata.id = newdata.id + '-' + newdata.parent_id;
            }
            load_element(type,newdata,parentDivId)
            if (elementType === 'item' || elementType === 'alarm'){
                addItemButtonsEvents(newdata,elementType);
            }else if (elementType === 'table_event'){
                addItemButtonsEvents(newdata,'events');
            }else if (elementType === 'calc_item'){
                update_numbers(1,newdata.id ,newdata.table_id ,'item');
            }
        }else{
            let newrowId = `${newdata.id}_${elementType}_temp`;
            if (elementType === 'table_event'){
                const similarELements = document.querySelectorAll(`input[type="hidden"][value="${newdata.item_id}"]`);
                console.log(similarELements);
                similarELements.forEach((input) => {
                    if (input.id !== 'event_item_id'){
                        const id = input.id.replace('_item_id', '');
                        console.log(`N value for input ${input.id}: ${id}`);
                        newrowId = `${id}_${elementType}_temp`;
                        updateHTML(newdata,newrowId);
                        addItemButtonsEvents(newdata,'events');
                    }
                });
                similarELements.forEach((input) => {
                    if (input.id !== 'event_item_id'){
                        const id = input.id.replace('_item_id', '');
                        console.log(`N value for input ${input.id}: ${id}`);
                        newrowId = `${id}_${elementType}_temp`;
                        addItemButtonsEvents(newdata,'events');
                    }
                });
            }
            console.log('Server response:', newrowId);
            if  (elementType !== 'table_event'){
                updateHTML(newdata,newrowId);
            }
            if (elementType === 'period'){
                const editButton = document.getElementById(newdata.id+'_edit');
                console.log(editButton)
                if (editButton) {
                    editButton.addEventListener('click', function (event) {
                        setperiodformvalues(newdata)
                        showForm('overlay_period_edit')
                     })
                }
                getnewspans(newdata.id,'period');
            }else if(elementType === 'calc_item'){
                var count = document.getElementById(newdata.id+'_count').value;
                update_numbers(Number(count),newdata.id ,newdata.table_id ,'item');

                var hiddenInputs = document.querySelectorAll('input[type="hidden"][id$="_calc_item_id"][value="' + newdata.item_id + '"]');
                // Step 2 and 3: Extract n and search for elements with IDs 'n_item' and 'n_value'
                hiddenInputs.forEach(function(hiddenInput) {
                  var n = hiddenInput.id.replace('_calc_item_id', '');
                  var nItemElement = document.getElementById(n + '_item');
                  var nValueElement = document.getElementById(n + '_value');
                    console.log(n, nItemElement,nValueElement)
                  // Step 4: Set text content and value
                  if (nItemElement && nValueElement) {
                    nItemElement.textContent = newdata.item;
                    nValueElement.value = newdata.value;
                  }
                });
            }
        }
        if (elementType === 'table_event'){
            getnewspans(newdata.period_id,'table_event');
            return;

        }
        // Clear the form

        form.reset();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//------------------------------------------------ create page functions -----------------------------------------------------------------
function calculateEndDate() {
    // Get the values of start date and duration
    var startDate = new Date(document.getElementById('edit_start_date').value);
    var duration = parseInt(document.getElementById('edit_duration').value);
    var type = '';
    if (duration === 30){
        type = 'month'
        const months30 = [4,6,9,11];
        var currentYear = startDate.getFullYear();
        var currentMonth = startDate.getMonth() + 1;
        if (currentMonth === 2){
            if (currentYear%4 === 0){
                duration = 29;
            }else{
                duration = 28;
            }
        }else if (!months30.includes(currentMonth)){
            duration = 31;
        }
        console.log(currentMonth,currentYear%4)
    }
    console.log(duration);

    // Check if the start date is valid
    if (!isNaN(startDate.getTime())) {
        // Calculate the end date
        var endDate
        if (duration > 1){
            endDate = new Date(startDate.getTime() + (duration ) * 24 * 60 * 60 * 1000);
            while (endDate < new Date()) {
                endDate = new Date(endDate.getTime() + (duration ) * 24 * 60 * 60 * 1000);

            }
            if ( type !== 'month' ){
            endDate = new Date(endDate.getTime() - (1)* 24 * 60 * 60 * 1000);
            }
            console.log(endDate)
        }else{
            endDate = new Date(startDate.getTime())
        }
        // Format the end date to YYYY-MM-DD
        var formattedEndDate = endDate.toISOString().split('T')[0];

        // Set the value of the end date input
        document.getElementById('edit_end_date').value = formattedEndDate;
    } else {
        // Handle invalid start date
        console.error('Invalid start date');
    }
}

// Define a list to store added values
var addedTimes = [];

function addCategory() {
    console.log(addedTimes);
    var newCategory = $('#newCategory').val().trim();

    if (newCategory === '') {
        console.log('no period enterded')
        return; // If no value, do nothing
    }
    var optionText = newCategory;
    var optionValue = newCategory;

    if ($('#newCategory_start').length > 0 && $('#newCategory_end').length > 0) {
        // If start and end time inputs are present
        var startTime = $('#newCategory_start').val().trim();
        var endTime = $('#newCategory_end').val().trim();

         // Check if either startTime or endTime is empty
        if (startTime === '' || endTime === '') {
            console.log('incorrect timer')
            return; // If either is empty, do nothing
        }

        startTime = formatTime(startTime);
        endTime = formatTime(endTime)

        // Check if endTime < startTime for the current one and endTime > startTime for the 1st usage
        if (addedTimes.length > 0 && (endTime <= startTime && endTime >= addedTimes[0].start)) {
            console.log('incorrect timer')
                    return; // If conditions not met, do nothing
        }

        addedTimes.push({ start: startTime, end: endTime }); // Store the added values

        optionText += ' (' + startTime + ' - ' + endTime + ')';
        optionValue += '_' + startTime + '_' + endTime;
    }

    $('#categories').append($('<option>', {
        value: optionValue,
        text: optionText,
        selected: true
    }));

    $('#newCategory, #newCategory_start, #newCategory_end').val('');

    var numOptions = $('#categories option').length;
    $('#categories').attr('size', numOptions);
}
//-------------------------------------------------------------calculator functions--------------------------------------------------------------------
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
function calculate_avgtotals() {
    var myPieChart;
    //get required data
    const form = document.getElementById('avgtotals');
    const formData = new FormData(form);
    console.log(Object.fromEntries(formData.entries()));
    fetch('/calculate_avgtotals', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);
        var type = document.getElementById('avgSelect').value;
        var period = document.getElementById('periodType').value;
        var parent =document.getElementById('resultData');
        parent.innerHTML='';
        // display avg/total
        if (type === 'avg' || type === 'total'){
            var result = document.createElement('h4');
            result.textContent = type + ' = ' + data.result;
            parent.appendChild(result);
        }else {
            //create canva element
            var canvas = document.createElement('canvas');
            parent.appendChild(canvas);
            var ctx = canvas.getContext('2d');
            var chartLabels = [];
            var chartPercentage = [];
            var randomColors = [];
            var chartType ;
            //organize chart data based on it's type
            data.result.forEach(entry => {
                if (period === 'days'){
                    if  (type === 'chart'){
                        chartType = 'bar';
                        chartLabels.push('Day: '+ entry.date.split('-').slice(1).join('-'))
                    }else{
                    chartLabels.push('Day: '+ entry.date.split('-').slice(1).join('-') + ' - total: ' + entry.total);
                    }
                }else if (period === 'categories'){
                    if  (type === 'chart'){
                        chartType = 'bar';
                        chartLabels.push(entry.category)
                    }else{
                    chartLabels.push(entry.category + ' - total: ' + entry.total);
                    }
                }else if (period === 'weeks'){
                    if  (type === 'chart' ){
                        chartType = 'line';
                        chartLabels.push('Week ' + entry.week )
                    }else{
                    chartLabels.push('Week ' + entry.week + ' - total: ' + entry.total);
                    }
                }else {
                    var month_name = new Date(parseInt(entry.month.split('-')[0]),  parseInt(entry.month.split('-')[1]) - 1, 1).toLocaleString('default', { month: 'long' });
                    if  (type === 'chart'){
                        chartType = 'line';
                        chartLabels.push( month_name)
                    }else{
                    chartLabels.push( month_name + ' - total: ' + entry.total);
                   }
                }
                if (entry.avg){
                chartPercentage.push(entry.avg);
                }else{
                    chartPercentage.push(entry.total);
                }
                randomColors.push(getRandomColor());
        });

        //display pie chart
            if (type === 'pieChart'){
                var chartData = {
                labels: chartLabels,
                datasets: [{
                    data: chartPercentage,
                    backgroundColor: randomColors
                }]
            };
            // Create the pie chart
            var myChart = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: {
                    plugins: {
                        datalabels: {
                            color: '#fff',
                            anchor: 'end',
                            align: 'start',
                            offset: 10,
                            font: {
                                weight: 'bold'
                            },
                            formatter: function(value, context) {
                                return chartPercentage[context.dataIndex] + '%';
                            }
                        }
                    }
                }
            });
            }else{
                //display line/bar charts
                var label = period === 'days' || period === 'categories' ? period + ' totals' : period + ' averages';
                var backgroundColor = chartPercentage.map(value => value >= 0 ? 'green' : 'red');
                console.log(label);
                var chartData = {
                            labels: chartLabels,
                            datasets: [{
                                data: chartPercentage.map(value => Math.abs(value)),
                                label: label,
                                backgroundColor: getRandomColor()
                            }]
                        };
                // Create the line chart
                var myChart = new Chart(ctx, {
                    type:chartType,
                    data: chartData,
                    options: {
                        scales: {
                        x: {
                            type: 'category',
                            labels: chartLabels
                            },
                        y: {
                            beginAtZero: true
                        }
                        }
                    }
                });
            }
        }

    })

    .catch(error => {
        console.error('Error:', error);
    });
}


//------------------------------------------------
function handleAutocompleteChange(input,id) {
    console.log('called');
    var datalist = document.getElementById( id +'_autocompleteList');
    var selectedItem = Array.from(datalist.options).find(option => option.value === input.value);
    var itemIdInput = document.getElementById(id +'_item_id');
    var valueInput = document.getElementById(id +'_new_value');
    console.log(valueInput,itemIdInput,selectedItem)
    if (selectedItem) {
      itemIdInput.value = selectedItem.dataset.item;
      valueInput.value = selectedItem.dataset.value;
    } else {
      itemIdInput.value = '';
      valueInput.value = '';
    }
  }


function update_numbers(updated_value,id,table_id,type){
    console.log('called',id);
    var data;
    if (type === 'item'){
        var value = document.getElementById( id +'_value').value;
        var total = document.getElementById( id +'_total').value;
        document.getElementById( id +'_total').value = updated_value * value;
        var category_id = document.getElementById( id +'_count').closest('ul').id.split('_')[0];
        console.log(category_id);
        var new_total = Number(updated_value)*Number(value)
        var added;
        if (updated_value != 0 && new_total === Number(total)){
            added = new_total
        }else{
            added = new_total - Number(total)
        }
        console.log(new_total-Number(total));
        var category_total = document.getElementById(category_id +'_totals')
        if (category_total){
            category_total.value = Number(category_total.value)+(added);
        }
        data = {item_id: id, updated_value:updated_value, table_id:table_id, total:new_total, type:type };
    }else if (type === 'category'){
        var factor = Number(document.getElementById(id +'_factor').value)
        console.log(factor)
        id = id.split('-')[0]
        var buttons = document.querySelectorAll(`button[id^="${id}"][id$="_sign"]`);
        var factors = document.querySelectorAll(`input[id^="${id}"][id$="_factor"]`);
        console.log(factors)
        factors.forEach(function(factor) {factor.value  = -1 * factor.value;})
        if (factor === -1){
            buttons.forEach(function(button){button.style.backgroundColor='#212529';})
        }else{
            buttons.forEach(function(button){button.style.backgroundColor='#E6663E';})
        }
        data = {item_id: id, updated_value:-factor, table_id:table_id, type:type };
     }else{
        data = { updated_value:updated_value, table_id:table_id, type:type };
     }
    fetch('/update_numbers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);
        data.items.forEach(function (item){
            console.log('item', item);
            var element_id = item.id +'_Totals'
            var element = document.getElementById(element_id)
            console.log(document.getElementById(element_id), element_id,item.value );
            if (element){
                element.value = item.value
                console.log(element.value,item.value)
            }else{
                element = document.getElementById(item.id)
                if (element){
                    element.value = item.value
                    console.log(element.value,item.value)
                }
            }
        })
    })
    .catch(error => {
        console.error('Error:', error);
    });
  }



 function calculate_sum(itemId,item,n){
    var total = document.getElementById(`${itemId}_total`);
    var count = document.getElementById(`${itemId}_count`);
    var value = document.getElementById(`${itemId}_value`);
    console.log(count.value,total.value,value.value,item )
    count.value = Number(count.value) + Number(item['count']);
    total.value = Number(total.value) + Number(item['total']);
    value.value = total.value  / count.value;
    console.log(count.value,total.value,value.value )
}
                                                   //-------------------------------------------------------------
function filterItemsByDate(targetDate, category_id, category_divId,items) {
    console.log(targetDate)
    //get items in the target date
    var filtereditems = items.filter(function (item) {
       console.log(item['date'],targetDate)
        return item['date'] === targetDate;
    });
    // Create a list of dictionaries with unique category information
    var uniqueCategoryIds = new Set();
    var categoryList = filtereditems.reduce(function (acc, item) {
        if (!uniqueCategoryIds.has(item['category_id'])) {
            uniqueCategoryIds.add(item['category_id']);
             acc.push({
                'category_id': item['category_id'],
                'category': item['category'],
                'date': item['date'],
                'week': item['week'],
                'factor':item['factor']
            });
        }
        return acc;
    }, []);

   console.log(categoryList);

   // load categories data and merge similar categories
   categoryList.forEach(function (category) {
      categoryData = { id: `${category['category_id']}-${category_id}`, category: category['category'],'category_id': category['category_id'],'factor':category['factor'],'date': category['date'],'week': category['week'] };
      var total = 0;
      var categoryElement = document.getElementById(`${category['category_id']}-${category_id}_category_accordion_temp`);
      console.log(categoryElement)

      if (!categoryElement) {
        if (category_id !== 'show' ) {
            load_element('category_accordion_temp', categoryData, category_divId);
        } else {
            load_element('category_accordion_temp', categoryData,'show-container');
        }
      }else{
        total_view =  document.getElementById(`${categoryData.id}_totals`);
        total = parseInt(total_view.value, 10) || 0;
        console.log(total,total_view,total_view.value);
    }

      //  load items for the current category and merge similar items
      filtereditems.forEach(function (item) {
        if (item['category_id'] === category['category_id']  && item.item_id !== 1) {
         // check for similar items inside same category
         var categoryElement = document.getElementById(`${category['category_id']}-${category_id}_category_accordion_temp`);
         if (categoryElement) {
            console.log('found category',categoryElement);
            var nestedElements = categoryElement.querySelectorAll('[id$="_calc_item_id"]');
            console.log(nestedElements);
            // merge the same items
            if (nestedElements.length > 0) {
                var matchFound = false;
                for (const nestedElement of nestedElements) {
                    var item_id = nestedElement.value;
                    console.log(item_id, item['item_id']);
                    if (String(item['item_id']) === String(item_id)) {
                        var itemId = nestedElement.id.replace(/_calc_item_id$/, '');
                        console.log('item_id:', item_id);
                        //calculate merged items total
                        calculate_sum(itemId, item);
                        matchFound = true;
                        var deleteButton = document.getElementById(`${itemId}_delete_btn`);
                        if (deleteButton) {
                            deleteButton.addEventListener('click', function () {
                                remove(`${itemId}_calc_item_temp`, item['id'], 'calc_item')
                            });
                        }
                        break;
                    }
                }
                if (!matchFound) {
                    item['calc_item_id'] = item['item_id'];
                    console.log('load element', item);
                    if (item['item_id'] !== 0){
                        load_element('calc_item_temp', item, `${categoryData['id']}_category_container`);
                    }
                }
            } else {
                item['calc_item_id'] = item['item_id'];
                console.log('load element', item);
                if (item['item_id'] !== 0){
                    load_element('calc_item_temp', item, `${categoryData['id']}_category_container`);
                }
            }
        }
        //calculate categories total;
         total += (item['count'] * item['value'])
         console.log(item,total)
        }
      });
      // set categories total
      var total_view = document.getElementById(`${categoryData.id}_totals`)
      console.log(category,total)
      if (total_view){
        total_view.value = total;
      }
      // Add category event listener
      var categoryItems = filtereditems.filter(function (item) {
            return item['category_id'] === category['category_id'];
      });
      var deleteButton = document.getElementById(`${categoryData.id}_delete_btn`);
      if (deleteButton) {
          deleteButton.addEventListener('click', function () {
             categoryItems.forEach(function (item) {
                    remove(`${item['id']}_calc_item_temp`, item['id'], 'calc_item');
             });
             var categoryElement = document.getElementById(`${category['category_id']}-${category_id}_category_accordion_temp`);
             categoryElement.style.display='none';
          });
      }
   });
}
                                        //---------------------------------------------------------------------

function calculateTotals(date, type, Items) {
    var filteredItems;
    if (type === 'd'){
     filteredItems = Items.filter(item => item['date'] === date );
    }else if (type === 'm') {
        filteredItems = Items.filter(item => new Date(item['date']).getMonth() + 1 === date );
    }else if (type === 'w') {
        filteredItems = Items.filter(item => (item['week']) === date );
    }
    const sum = filteredItems.reduce((accumulator, item) => accumulator + (item['total']*item['factor']), 0);
    // Log the result to the console
    console.log(`Sum for date ${date} and type ${type}: ${sum}`);
    console.log(`Sum for date ${date} and type ${type}: ${sum}`);
    // Return the sum if it's greater than 0, otherwise return 0
    return sum ;

}
                                        //----------------------------------------------------------------------
function showElements(m, w, d,All,current,n_days, filteredItems,month_data) {
    let m_length = Object.keys(month_data).length;
    let m_loop = 0;
    console.log("show elments");
    console.log("Month Data:", month_data,month_data.length);
    console.log("Filtered Items:", filteredItems);
    //start month loop
    Object.keys(month_data).forEach(function(monthName) {
        m_loop+=1;
        var monthObject = month_data[monthName];
        console.log("month loop",m_loop);
        var monthNumber = parseInt(monthName.split('-')[1], 10);
        console.log(monthNumber);
        // Check if the current month is in filteredItems
        var isCurrentMonthInFilteredItems = filteredItems.some(item => {
           var itemMonth = item.date.slice(0, 7);
            console.log( parseInt(itemMonth.slice(5), 10));
            return parseInt(itemMonth.slice(5), 10) === monthNumber;
        });
        if (isCurrentMonthInFilteredItems || All) {
            console.log(`Current month ${monthName} is in filteredItems.`);
            if (m) {
                var monthTotals = calculateTotals(monthNumber, 'm',filteredItems);
                var monthData = { id: `${monthName}`, text: `${monthName}`, Totals: monthTotals, date:monthNumber };
                load_element('accordion', monthData, 'show-container');
                if (current){
                    var element = document.getElementById(monthData.id + '_collapse');
                    if (element) {
                        console.log(element);
                        element.classList.add('show');
                    }
                }
                var categoryId = `${monthName}`;
            }
            // get week data
            var weeks = monthObject;
            console.log("weeks",weeks);
            let w_length = weeks.length;
            let w_loop = 0;
            //start week loop
            Object.keys(monthObject).forEach(function(weekName) {
                w_loop+=1
                console.log("week loop",w_loop);
                var weekObject = monthObject[weekName];
                var weekNumber = parseInt(weekName.slice(4), 10);
                console.log(weekNumber);

                var isCurrentWeekInFilteredItems = filteredItems.some(item => {
                    var itemWeek = item.week;
                    console.log(itemWeek);
                    return itemWeek == weekNumber;
                });
                //load week
                if (isCurrentWeekInFilteredItems || All) {
                    console.log(`Current week ${weekName} is in filteredItems.`);
                    if (w) {
                        var weekTotals = calculateTotals(weekNumber, 'w',filteredItems);
                        var weekData;
                        if (m) {
                            weekData = { id: `${weekName}-${monthName}`, text: `${weekName}`, Totals: weekTotals,week:weekNumber };
                            // Load the element with id 'week' and data 'weekData' into the container 'month_container'
                            load_element('accordion', weekData, `${monthName}_container`);
                            categoryId = `${weekName}-${monthName}`;
                        } else {
                            weekData = { id: `${weekName}`, text: `${weekName}`, Totals: weekTotals,week:weekNumber };
                            // Load the element with id 'week' and data 'weekData' into the container 'show-container'
                            load_element('accordion', weekData, 'show-container');
                            if (current){
                                var element = document.getElementById(weekData.id + '_collapse');
                                if (element) {
                                    element.classList.add('show');
                                }
                            }
                            categoryId = `${weekName}`;
                        }
                    }
                    //get this week days data
                    var days = weekObject;
                    let d_length = days.length;
                    let d_loop = 0;
                    // start day loop
                    Object.keys(weekObject).forEach(function (day) {
                        d_loop+=1
                        console.log("day loop",d_loop);
                        var currentDate = weekObject[day];
                        console.log("currentDate:", currentDate);
                        var formattedCurrentDate = currentDate.slice(4); // Assuming the date format is consistent
                        console.log("formattedCurrentDate:", formattedCurrentDate);
                        // check if day has items
                        var isCurrentDateInFilteredItems = filteredItems.some(item => {
                        var itemDate = item.date.slice(0, 10);
                        console.log("itemDate:", itemDate);
                        return itemDate === formattedCurrentDate;
                        });
                        // if day has items load day
                        if (isCurrentDateInFilteredItems || All) {
                            var day = currentDate.slice(0, 3);
                            console.log(`Current date ${currentDate} is in filteredItems.`);
                            if (d) {
                                var dayTotals = calculateTotals(formattedCurrentDate, 'd',filteredItems);
                                var dayData = { id: `${day}-${weekName}`, text: `${day}-${formattedCurrentDate}`, Totals: dayTotals ,date:formattedCurrentDate,week:weekNumber};
                                // load day in it's suitable parent
                                if (w && m) {
                                    load_element('accordion', dayData, `${weekName}-${monthName}_container`);
                                } else if (w) {
                                    load_element('accordion', dayData, `${weekName}_container`);
                                } else if (m) {
                                    load_element('accordion', dayData, `${monthName}_container`);
                                } else {
                                    load_element('accordion', dayData, 'show-container');
                                    if (current && !w &&!m){
                                        var element = document.getElementById(dayData.id + '_collapse');
                                        if (element) {
                                            element.classList.add('show');
                                        }
                                    }
                                }
                                categoryId = `${day}-${weekName}`;
                            }
                            //load categories in it's suitable parent
                            if (!d && !m && !w){
                                    filterItemsByDate(formattedCurrentDate, 'show', 'show-container',items);
                            }else{
                                filterItemsByDate(formattedCurrentDate, categoryId, `${categoryId}_container`,items);
                            }
                        } else {
                            console.log(`Current date ${currentDate} is not in filteredItems.`);
                        }
                    })
                    // end of day loop
                } else {
                    console.log(`Current week ${weekName} is not in filteredItems.`);
                }
            })
        }else{
            console.log(`Current month ${monthName} is not in filteredItems.`);
        }
    })
}
                    //------------------------------------------------------------------------------
function filteritems(n, filtertype,items,month_data){
    console.log("called filter");
    if(n){
        console.log("found", n);
        let lastDate = null;
        var Week = '0';
        for (const month in month_data) {
            const weeks = month_data[month];
            for (const week in weeks) {
                if (week.replace(/\D/g, '') > Week){
                 const dates = weeks[week];
                 console.log(week.replace(/\D/g, ''),Week)
                 console.log(week,dates)
                 const lastDateInWeek = dates[dates.length - 1];
                 lastDate = lastDateInWeek.split(',')[1];
                 Week = week.replace(/\D/g, '');
                }
            }
         }
         console.log(lastDate)
        if (filtertype === 'd'||filtertype === 'c'){
            var currentDate = new Date(lastDate).toISOString().slice(0, 10);
            console.log("Current Date:", currentDate);
            return items.filter(item => {
                var itemDate = new Date(item.date);
                var timeDifference = new Date(currentDate) - itemDate;
                var daysDifference = timeDifference / (1000 * 3600 * 24);
                return daysDifference < n;
            });
        }else if (filtertype === 'm'){
            var currentMonth = new Date(lastDate).toISOString().slice(0, 7);
            console.log("Current Month:", currentMonth);
            var date = new Date(currentMonth);
            date.setMonth(date.getMonth() - (n-1));
            var endMonth = date.toISOString().slice(0, 7);
            return items.filter(item => {
                var itemMonth = item.date.slice(0, 7);
                return itemMonth >= endMonth && itemMonth <= currentMonth;
            });
        }else if (filtertype === 'w'){
            var monthNumber = new Date(lastDate).getMonth() + 1;
            var Month = new Date(lastDate).toLocaleString('default', { month: 'long' });
            var formattedMonth = `${Month}-${monthNumber}`;
            var currentWeek = Object.keys(month_data[formattedMonth]).pop();
            // Extract the numeric part from the week key
            var weekNumber = currentWeek.replace(/\D/g, '');
            console.log("Current Week:", weekNumber);
            return items.filter(item => {
                return weekNumber - item.week < n;
            });
        }
    }else{
        return items;
    }
}
                             //------------------------------------------------------------------------------

function getFormValues(month_data,table_id) {
    console.log('Items to Show:', table_id);
    document.getElementById('show-container').innerHTML = '';
    var Days = document.getElementById('days').checked;
    var Weeks = document.getElementById('weeks').checked;
    var Months = document.getElementById('months').checked;
    var All = document.querySelector('input[name="range"][value="all"]').checked;
    var Current = document.querySelector('input[name="range"][value="current"]').checked;
    var custom = document.querySelector('input[name="range"][value="custom"]').checked;
    if (custom){
        document.getElementById('daysToshow').style.display = 'block';
    }else{
        document.getElementById('daysToshow').style.display = 'none';
    }
    var daysToShowTnput = document.getElementById('daysToshowInput').value;

    // Now you have the values, you can use them as needed
    console.log('Show Days:', Days);
    console.log('Show Weeks:', Weeks);
    console.log('Show Months:', Months);
    console.log('Show All:', All);
    console.log('Show Current:',Current);
    console.log('showcustom:',custom);
    console.log('daysToShowTnput:', daysToShowTnput);
    let n_days, type;
    if (!All){
      if (custom){
       document.getElementById('daysToshow').style.display = 'block';
       n_days = daysToShowTnput;
      }else{
       n_days= 1;
      }
    }
    if (Months){
      type = 'm';
    }else if (Weeks){
      type = 'w';
    }else if (Days){
     type = 'd';
    }else{
     type = 'c';
    }
    console.log('type:', type);
    console.log('n_days:', n_days);
    fetch('/calc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table_id: table_id }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('data',data);
    filtereditems = filteritems(n_days,type,data.items,month_data)
    // Assuming filterItems is a function you've defined elsewhere
    console.log('Items to Show:', filtereditems);
    console.log("Month Data:", month_data,month_data.length);
    showElements(Months, Weeks, Days,All,Current,n_days ,filtereditems,month_data);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}
                            //-------------------------------------------------------------------
function setDefaults(calculatorData) {
    console.log(calculatorData);
    var status = calculatorData[0]['duration'];
    if (status === 1) {
        document.getElementById('days').checked = true;
        document.getElementById('weeks').checked = true;
        document.getElementById('months').checked = true;
        document.querySelector('input[name="range"][value="all"]').checked = true;
    } else if (status === 7) {
        document.getElementById('days').checked = false;
        document.getElementById('weeks').checked = true;
        document.getElementById('months').checked = false;
        document.querySelector('input[name="range"][value="current"]').checked = true;
    } else if (status === 30) {
        document.getElementById('days').checked = false;
        document.getElementById('weeks').checked = false;
        document.getElementById('months').checked = true;
        document.querySelector('input[name="range"][value="current"]').checked = true;
    } else if (status === 0) {
        document.getElementById('days').checked = true;
        document.getElementById('weeks').checked = false;
        document.getElementById('months').checked = false;
        document.getElementById('daysToshow').style.display = 'none';
        document.querySelector('input[name="range"][value="current"]').checked = true;
    } else {
        document.getElementById('days').checked = false;
        document.getElementById('weeks').checked = false;
        document.getElementById('months').checked = false;
        document.querySelector('input[name="range"][value="custom"]').checked = true;
        document.getElementById('daysToshowInput').value = status;
    }
}

//----------------------------------------------------------------------------------------------------
function check_event_form(event,all_items,formId,type){
    event.preventDefault();
    const form = document.getElementById(formId);
    console.log(form);
    const formData = new FormData(form);
    console.log(Object.fromEntries(formData.entries()));
    var event_type = document.getElementById('event_type').value;
    var element_id = document.getElementById('pick_item').value;
    var period_id = document.getElementById('new_event_period_id')
    if (period_id){
    var period_id = period_id.value;
    }
    console.log(event_type,element_id);
    var frequencySelect = document.getElementById('frequency');
    var frequency = frequencySelect.value;
    var dates =[];
    if (frequency === '1' && type !== 'alarm' &&  type !== 'index_table_event'){
        console.log('wrong');
        document.querySelectorAll('[id$="_daycheckbox"]').forEach(checkbox => {
            dates.push(checkbox.value);
        });
        frequencySelect.value = frequencySelect.options[0].value;
    }else if (frequency === 'tempdays'){
        selected_date = Array.from(document.querySelectorAll('[id$="_daycheckbox"]')).filter(checkbox => checkbox.checked).forEach(checkbox => {
        dates.push(checkbox.value);
        });
        frequencySelect.value = frequencySelect.options[0].value;
    }else if (type === 'alarm'|| type === 'index_table_event'){
        if ( document.getElementById('pickdays').checked){
        selected_date = Array.from(document.querySelectorAll('[id$="_daycheckbox"]')).filter(checkbox => checkbox.checked).forEach(checkbox => {
            dates.push(checkbox.value);
            });
        }else{
            dates.push(document.getElementById('Date').value);
        }
    }else{
        console.log('correct');
        dates.push(document.getElementById('Date').value);
        frequencySelect.value = frequency;
    }
    console.log(dates,frequencySelect.value)

    dates.forEach(function(date,index) {
    setTimeout(() => {
    document.getElementById('Date').value = date;
    console.log(date, document.getElementById('Date').value);
        if (type === 'alarm'){
            console.log(index,'loop')
            submitForm(event, 'create', 'alarm', 'eventForm', 'alarms-container');
        }else if (type === 'index_table_event'){
            submitForm(event, 'create', 'table_event', 'eventForm', 'index_event');
        }else {
            submitForm(event, 'create', 'table_event', 'eventForm', `${period_id}_period_${date}_addbtn`);
        }
    },index*1000);
})
if (type === 'index_table_event'){
    setTimeout(() => {
     Generate_main_table();
    },dates.length*1000);
}
    return false;
}


//----------------------------------------------------------------------------------------------------------------------------
function pick_table(value) {
    var linkValueSelect = document.getElementById('links');
    var linkedItemSelect = document.getElementById('items');

    if (value !== 'event'){
        linkValueSelect.style.display = 'block';
        if (value !== 'table'){
         linkedItemSelect.style.display = 'block'
        } else {
           linkedItemSelect.style.display = 'none';
        }
    }else{
        linkValueSelect.style.display = 'none';
        linkedItemSelect.style.display = 'none';
    }
}
function pick_link_table() {
    console.log('pickitem',link_items);

    var linkValueSelect = document.getElementById('linkvalue');
    var linkedItemSelect = document.getElementById('pick_item');
    var value = document.getElementById('event_type').value;

    // Get the selected option's data-table-id attribute
    var selectedTableId = linkValueSelect.options[linkValueSelect.selectedIndex].getAttribute('data-table-id');
    var linkTitle = linkValueSelect.options[linkValueSelect.selectedIndex].textContent;
    if (value === 'table'){
      document.getElementById('eventName').value = linkTitle;
    }
    console.log(selectedTableId,value)
    var filteredItems = link_items.filter(item => item.table_id == selectedTableId && item.type == value );
    console.log(filteredItems);
    linkedItemSelect.innerHTML = '';
    var option = document.createElement('option');
    option.textContent = "--";
    option.value="";
    linkedItemSelect.appendChild(option);
    filteredItems.forEach(item => {
        var option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.item;
        linkedItemSelect.appendChild(option);
    });
}
//----------------------------------------------------------------------------------------------------
function getNextDate(dayOfMonth) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextDate = new Date(currentYear, currentMonth, dayOfMonth,0, 0, 0, 0);
    // Check if the date is in the past, if so, move to the next month
    if (today >= nextDate) {
        nextDate.setMonth(currentMonth + 1);
    }

    return nextDate;
}

function getNextWeekday(weekday) {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilNextWeekday = (weekday - currentDay + 7) % 7;
    const nextWeekday = new Date(today);
    nextWeekday.setDate(today.getDate() + daysUntilNextWeekday);
    return nextWeekday;
}

// Example usage:
function load_days(){
    var duration = document.getElementById('frequency').value;
    var pick = document.getElementById('pickdays').checked;
    var parentDiv = document.getElementById('daystoSelect');
    parentDiv.innerHTML ='';
    document.getElementById('Date').disabled = false;
    if (pick){
        document.getElementById('Date').disabled = true;
        if (duration === '30'){
            for (let n = 1; n <= 31; n++) {
                const nextDate = getNextDate(n+1);
                const data = { 'id': n, 'daycheckbox': nextDate.toISOString().split('T')[0],'daylable': n };
                console.log(data);
                load_element('day', data, 'daystoSelect');
            }
        }else if (duration === '7'){
            for (let n = 0; n < 7; n++) {
                const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const nextWeekday = getNextWeekday(n);
                const data = { 'id': n, 'daycheckbox': nextWeekday.toISOString().split('T')[0],'daylable':weekdays[n] };
                console.log(data);
                load_element('day', data, 'daystoSelect');
            }
        }
    }
}
//---event form --
function checkselection(selected){
    var showDays = document.getElementById("selectInput_div");
    if (showDays){
        if(selected ==='tempdays'){
            showDays.style.display = 'block'
        }else{
            showDays.style.display = 'none';
        }
    }
}




//---------------------------------------------------------------------------
function set_col_span(colspan) {
    console.log(colspan);
    const days = document.querySelectorAll('[id^="day_"]');
    console.log('set col span');
    if (colspan) {
        const elements = document.querySelectorAll('[id$="addbtn"]');
        // Iterate through the selected elements
        elements.forEach(element => {
            const parts = element.id.split('_');
            const targetId = parts[0];
            let idMatches = false;
            for (const id in colspan) {
                if (colspan.hasOwnProperty(id)) {
                    if (id === targetId) {
                        idMatches = true;
                        break;
                    }
                }
            }
            if (!idMatches) {
                element.style.display='none';
            }
        });
        // Loop through the keys in the colspan object
        for (const id in colspan) {
            if (colspan.hasOwnProperty(id)) {
                // Get the HTML element by its ID
                const colspanValue = colspan[id];
                console.log(id);
                console.log(colspanValue);
                // Select all elements whose IDs end with "_id"
                const elements = document.querySelectorAll(`[id^="${id}_period"]`);
                // Loop through the selected elements
                const tdAndThElements = Array.from(elements).filter(element => ['td', 'th'].includes(element.tagName.toLowerCase()));
                console.log(elements);
                tdAndThElements.forEach(element => {
                    console.log(element,colspanValue);
                    // Set the colspan attribute of each element to the corresponding value
                    element.colSpan = colspanValue;
                    // Check if colspanValue is 0, hide the element
                    if (colspanValue === 0) {
                        console.log('hide');
                        element.style.display = 'none';
                    }else{
                        element.style.display = '';
                    }
                });
                days.forEach(day => {
                    const date =day.id.split('_')[2];
                    const elements = document.querySelectorAll(`[id^="${id}_period_${date}"]`);
                    const tdAndThElements = Array.from(elements).filter(element => ['td', 'th'].includes(element.tagName.toLowerCase()));
                    let lenght = tdAndThElements.length;
                    console.log(tdAndThElements.length);
                    tdAndThElements.forEach(element => {
                        console.log(element,lenght,colspanValue,colspanValue/lenght);
                        // Set the colspan attribute of each element to the corresponding value
                        element.colSpan = colspanValue/lenght;
                    });
                });
            }
        }
    }
}
//---------------------------------------------------------------------------
function getnewspans(id,type,table_id){
    if (type === 'noperiod'){
        const trCount = document.querySelectorAll('tr[id^="day_"]').length;
        const tdCount = document.querySelectorAll('td[id$="addbtn"]:not([style*="display: none"])').length;
        const periodContainer = document.getElementById('period-container');
        const periodContainerTdCount = periodContainer ? periodContainer.querySelectorAll('td').length : 0;
        console.log(periodContainerTdCount,periodContainer,tdCount,trCount)
        if (periodContainerTdCount === 0 && tdCount <= trCount) {
            console.log('reload')
            location.reload();
            return;
        }
    }else{
    // Your data to be sent in the POST request
    const days = document.querySelectorAll('[id^="day_"]');
    const datesArray = Array.from(days).map(day => day.id.split('_')[2]);
    const Title = document.title;
    page = Title.split(' ')[1];
    const data = {'id':id,'type':type,'days':datesArray,'page':page,'table_id':table_id }
    console.log(data)
    // Send a POST request to the Flask route
    fetch('/get_spans', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // Add any other headers as needed
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const status = data.status;
        const colspan = data.colspan;
        const days = data.days;
        if (status === 'success') {
            console.log('set_col_span')
            set_col_span(colspan);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
    }
}
//---------------------------------------------------------------------------
function show_hide_periodBtn(){
    const targetTdElements = document.querySelectorAll('td[id*="_period_"]:not([id$="addbtn"])');
    if (targetTdElements.length > 0) {
        console.log('Found matching TD elements:', targetTdElements);
        document.getElementById('add_period_btn').style.display = 'none';
    } else {
        console.log('No matching TD elements found.');
        document.getElementById('add_period_btn').style.display = '';
    }
}

function setformvalues(period, day) {
    var dateInput = document.getElementById("Date");
    dateInput.value = day;
    var timerInput = document.getElementById("Timer");
    // Set min and max values
    timerInput.min = convertToHHMMFormat(period['timer_start']);
    timerInput.max = convertToHHMMFormat(period['timer_end']);
    // Set default value
    timerInput.value =convertToHHMMFormat(period['timer_start']);
    var periodInput = document.getElementById("new_event_period_id");
    periodInput.value = period['id'];
}
//----------------------------------------------------------------------------
function loadtableperiodbtn(currentPeriod,table_id,link_items){
    const days = document.querySelectorAll('[id^="day_"]');
    // Loop through the elements
     days.forEach(day => {
        const date =day.id.split('_')[2];
        const data = { id: currentPeriod.id + '_period_' + date };
        // Log the parts
        console.log('Element ID:', day.id);
        console.log('date :', date );
        console.log('data :', data );
        load_element('addbtn', data, `${day.id}`);
        const addButton = document.getElementById(data.id + '_addbtn');
        if (addButton) {
            addButton.addEventListener('click', function (event) {
                setformvalues(currentPeriod, date);
                showForm('overlay_event');
                var showDays = document.getElementById("selectInput_div");
                if (showDays){
                    showDays.style.display = 'none';
                }
                    const form = document.getElementById('eventForm');
                    if (form) {
                        form.onsubmit = function (event) {
                            check_event_form(event,link_items,'eventForm','table_event')

                        };
                    }
            })
        }
    })
    getnewspans(currentPeriod.id,'period',table_id)
}
//----------------------------------------------------------------------------
function convertToHHMMFormat(timeString) {
    var date  = new Date("2000-01-01 " + timeString);
    var hours = date.getHours().toString().padStart(2, '0');
    var minutes = date.getMinutes().toString().padStart(2, '0');
    console.log( hours + ':' + minutes)
    return hours + ':' + minutes;
}

function setperiodformvalues(period){
    console.log('set form')
    var nameInput = document.getElementById('edit_period');
    var timerStartInput = document.getElementById('edit_timer_start');
    var timerEndInput = document.getElementById('edit_timer_end');
    var idInput = document.getElementById('edit_id');
    // Set the values
    console.log(period['period'],period['timer_start'],period['timer_end'],period['id'])
    console.log(timerEndInput,timerStartInput)
    nameInput.value =period['period'];
    timerStartInput.value = convertToHHMMFormat(period['timer_start']);
    timerEndInput.value = convertToHHMMFormat(period['timer_end']);
    idInput.value =  period['id'];
}
//-----------------------------------------------------------------------------
function loadtableperiod(periods,table_id,link_items){
    const default_periods=[
        { 'period': 'morning', 'timer_start': '06:00', 'timer_end': '12:00'},
        { 'period': 'afternoon', 'timer_start': '12:00', 'timer_end': '18:00'},
        { 'period': 'night', 'timer_start': '18:00', 'timer_end': '00:00'},
        { 'period': 'dawn', 'timer_start': '00:00', 'timer_end': '06:00'}
    ];
    var n = 1
    if(periods.length > 0){
       periods.forEach((period) => {

        const isMatching = default_periods.some((defaultPeriod) => {
            return (
                period.period === defaultPeriod.period &&
                period.timer_start === defaultPeriod.timer_start &&
                period.timer_end === defaultPeriod.timer_end
            );
        });
        console.log(period,isMatching);
        if (isMatching) {
            console.log(document.getElementById(`${n}_timer`),n);
            document.getElementById(n +'_timer').id =period.id+'_timer';
            loadtableperiodbtn (period,table_id,link_items);
            n+=1;
        }else{
            load_element('period_temp',period,'period-container')
            console.log(period.id)
            const editButton = document.getElementById(period.id+'_edit');
            console.log(editButton)
            if (editButton) {
                editButton.addEventListener('click', function (event) {
                    setperiodformvalues(period)
                    showForm('overlay_period_edit')
                })
            }
                loadtableperiodbtn (period,table_id,link_items);
                getnewspans(period.id,'period',table_id)
        }
       })
    }
}

//----------------------------------------------------------------------------------------------------
function insertCellAfter(targetCellId, content,data) {
    const targetCell = document.getElementById(targetCellId);
    // Step 2: Create a new cell
    const newCell = document.createElement('td');
    newCell.id = data.period_id+'_period_'+data.date+'-'+data.id;
    newCell.classList.add('celldimension');

    // Step 3: Set content or attributes for the new cell
    newCell.innerHTML = content;
    // Step 4: Insert the new cell after the target cell
    targetCell.parentNode.insertBefore(newCell, targetCell.nextSibling);
}
//----------------------------------------------------------------------
function loadtablecell(periods,items,current_links){
    const days = document.querySelectorAll('[id^="day_"]');
    // Loop through the elements
    days.forEach(day => {
        const date =day.id.split('_')[2];
        // Log the parts
        console.log('Element ID:', day.id);
        console.log('date :', date );
        periods.forEach((period) => {
            const data = { id: period.id + '_period_' + date };
            console.log(period);
            items.forEach((item) => {
              console.log(item.date,date,item.period_id,period.id);
              if (item.date === date && item.period_id === period.id){
                    console.log(item);
                    load_element('table_event_temp', item, `${data.id}_addbtn`);
                    setState(item,current_links);
                    addItemButtonsEvents(item,'events');
                    getnewspans(item.period_id,'period');
                    update_color(item.id+'_table_event_temp',item.color,'load');
              }
            });
        });
    });
  }
  //---------------------------------------------------------------------------------------
  function parseTime(timeString) {
    // Assuming timeString is in "HH:mm" format
    var parts = timeString.split(":");
    return new Date(0, 0, 0, parseInt(parts[0]), parseInt(parts[1]));
}
  //main table function
  function Generate_main_table(chosen_date,last_update_date) {
    const selectedValue = document.getElementById('durationSelect').value;
    var current_date;
    if(!chosen_date){
        current_date = new Date().toISOString().slice(0, 10);
    }else{
         current_date = chosen_date
    }
    if(!last_update_date){
        last_update_date = current_date
    }

    // Prepare the data to send
    const data = {
        selectedValue: selectedValue,
        date:current_date,
        last_update_date:last_update_date
    };
    console.log('genratetable',data)
    // Send a POST request to Flask endpoint
    fetch('/generate_table', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);
        var tableBody = document.getElementById("timetablebody");
        var tablehead = document.getElementById("period-container");
        tableBody.innerHTML='';
        tablehead.innerHTML='';
        if (data.items && data.items.length > 0){
            // create periods
            var cell = document.createElement("th");
            tablehead.appendChild(cell);
            var periodsevents = [];
            data.periods.forEach(function (period, index) {
                    var hasItemsWithinPeriod = data.items.some(function (item) {
                        var itemTime = parseTime(item.timer);
                        var matchingPeriod = data.periods.find(function (period) {
                            var periodStart = parseTime(period.timer_start);
                            var periodEnd = parseTime(period.timer_end);
                            return itemTime >= periodStart && itemTime <= periodEnd;
                        });
                        if (matchingPeriod && !periodsevents.some(function (p) { return p.id === matchingPeriod.id; })) {
                            console.log(matchingPeriod);
                            periodsevents.push(matchingPeriod);
                        }
                    });
            })
            if (periodsevents.length > 0) {
                periodsevents.forEach(function (period){
                    console.log(period);
                    load_element('period_temp',period,'period-container')

                })
            }
            // crete row for days
            data.days.forEach(function (day, index) {
                var matchingItems = data.items.filter(function (item) {
                    return item.date === day.split(',')[1];
                });
                if (matchingItems.length > 0) {
                    var row = document.createElement("tr");
                    row.id = "day_" + (index + 1) + "_" + day.split(',')[1].toLowerCase();
                    var cell = document.createElement("td");
                    cell.id =  "Day " + (index + 1);
                    cell.className = "day-cell";
                    cell.textContent =  day;
                    row.appendChild(cell);
                    tableBody.appendChild(row);
                    var previousecell= cell.id ;
                    // load events
                    data.items.forEach((item) => {
                        console.log(item.date,item.period_id,day.split(',')[1]);
                        if (item.date === day.split(',')[1]){
                            console.log(item);
                            load_element('table_event_temp', item, previousecell);
                            setState(item,data.current_links);
                            addItemButtonsEvents(item,'events')
                            update_color(item.id+'_table_event_temp',item.color,'load');
                            previousecell = item.period_id+'_period_'+item.date+'-'+item.id;
                        }
                    });
                }
            });
            getnewspans(0,'period')
        }else{
            var cell = document.createElement("th");
            cell.textContent = "NO UPCOMING EVENTS";
            cell.style.fontSize = "35px"
            cell.style.color = "#fff"
            tablehead.appendChild(cell);

        }
        if(chosen_date){

                data.checkitems.forEach(function (item) {
                    const checkboxElement = document.getElementById(`${item.id}_status`);
                    if (checkboxElement && checkboxElement.type === 'checkbox') {
                            checkboxElement.checked = item.value === 100;
                        }
                });
                check_completion(data.checkitems)

        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}



//----------------------------------------------------------------------------------------------------------------------------------------
function update_color(cell_id,color_value,type){
    console.log(document.getElementById(cell_id),color_value)
    var cell = document.getElementById(cell_id);
    if (cell){
        cell.style.backgroundColor = color_value ;
        const r = parseInt(color_value.substring(1, 3), 16);
        const g = parseInt(color_value.substring(3, 5), 16);
        const b = parseInt(color_value.substring(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        cell.style.color = brightness > 128 ? 'black' : 'white';
        if (type === 'update'){
            fetch('/update_color', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: cell_id.split('_')[0],color:color_value }),
            })
            .then(response => response.json())
            .then(data => {
                console.log('data',data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
        }
    }
}