function highlightelements(id){
    console.log('highlight')
    var firstElement;
    var Elements = document.querySelectorAll(`[id$="${id}"]`);
    Elements.forEach(function(element) {
        console.log(element)
        if (!firstElement) {
            firstElement = element;
        }

        if (id == 'item_actions'){
          element.style.border = '2px solid rgba(247, 232, 145, 1)';
          element.style.add.Color ='rgba(247, 232, 145, 0.2)';
        }else{
            element.classList.add('highlight_Element');
        }
        element.style.mixBlendMode = 'soft-light;';

    });

}
function removehighlightelements(id){
    console.log('remove')
var Elements= document.querySelectorAll(`[id$="${id}"]`);
Elements.forEach(function(element) {
    console.log(element)
    if (id == 'item_actions'){
        element.style.border = '';
    }else{
        element.classList.remove('highlight_Element');
    }
});
}


function endtutorial(current,finale){
    console.log('exit tutorial')
    var duration = 0;
    if (current !== 3){
        playtutorial(finale);
        duration = 6000;
    }
    setTimeout(() => {
        const fluffball = document.getElementById('fluffball');
        fluffball.style.display = 'none';
        fluffball.style.backgroundImage = '';
        fluffball.style.width = '20px';
        fluffball.style.height = '20px';

        document.getElementById('gifContainer').style.display='none';
        document.getElementById('speechBubble2').style.display = 'none';
        localStorage.removeItem('page');
        localStorage.setItem('tutorial','off' )
        document.getElementById('endTutorial').style.display ='none';
        if(current !== 1 ){
            originalpage = localStorage.getItem('originalpage' )
            localStorage.removeItem('originalpage');
            if (originalpage){
                window.location.href = originalpage
            }else {
                location.reload();
            }
        }else {
            location.reload();
        }

    },duration)
}
function playtutorial(pageMessages) {
    console.log(pageMessages)
    document.getElementById("gifContainer").style.display='';
    pageMessages.forEach(step => {
         setTimeout(() => {
            if (step.gif){
              document.getElementById("kitty-gifs").src =`/static/gifs/${step.gif}.gif`;
            }
            console.log('play', step['message']);
            if (step.message) {
                var speechBubble = document.getElementById('speechBubble2');
                speechBubble.textContent = step.message;
                speechBubble.style.display = '';
            }
            console.log('play', step.id);
            if (step.script){
                eval(step.script);
                console.log(step.script);
            }
        }, step.duration);
    });
    document.getElementById('speechBubble2').style.display = 'none';
}

function get_Page_info(current){
    document.getElementById('readonly').style.display='';

    //hide main content
    const mainSection = document.getElementById('main');
    if (mainSection) {
        const elementsToHide = document.querySelectorAll('.tourelement');

        elementsToHide.forEach(element => {
            console.log(element);
            element.style.display = 'none';
        });
  } else {
    console.warn('Main section not found.');
  }
    // show exit tutorial button
    document.getElementById('endTutorial').style.display ='';
    // get curren tutorial page
    let page ='none'
    //first case tour start
    if (current === 0){
        // get original page to return to
        localStorage.setItem('originalpage', window.location.href)
        console.log(window.location.href);
        //start the tutorial
        localStorage.setItem('tutorial','on' )
        page ='startTutorial'
    }else if (current === 2 ){
        // seconed case when loading a new page with tutorial on
        page = localStorage.getItem('page');
        console.log(page);
    }else if (current === 1){
        // third case when requesting tutorial for the current page
        const Title = document.title;
        page = Title.split(' ')[1];
    }
    console.log(page)
        fetch('/tutorial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                template: page,
                current: current,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            if(current === 1){
                // case current page tutorial
                playtutorial(data.page_messeges);
                setTimeout(() => {
                endtutorial(current,data.finale);
            }, data.duration);
            }else if (data.current_page === 'startTutorial'){
                // starting a tutorial tour
                localStorage.setItem('page',data.page )
                data.duration = 0;
            }else if (data.current_page === 'intro'){
                startTutorial(data.page_messeges);
                localStorage.setItem('page',data.page );
                setTimeout(() => {
                    playtutorial(data.page_messeges);
                }, 11000);
            }else if (data.page === 'finale'){
                playtutorial(data.page_messeges);
                setTimeout(() => {
                    endtutorial(current,data.finale);
                },data.duration);
            }else{
                localStorage.setItem('page',data.page );
                playtutorial(data.page_messeges);
            }
            setTimeout(() => {
            if (data.url){
                window.location.href = data.url;
            }else{
                endtutorial(current);
            }
        }, data.duration);
        })
        .catch(error => {
            // Handle errors, e.g., log the error
            console.error('Error:', error);
        });

    }



function startTutorial(){

  document.getElementById('endTutorial').style.display ='';

    const fluffball = document.getElementById('fluffball');
    fluffball.style.display='';
    // Animation properties
    const duration = 3000; // 3 seconds

    // Set the final position and size
    const finalTop = 60;
    const finalLeft = 650;
    const endSize = 150;

    // Animate the fluffball
    fluffball.animate(
        [
            { top: '78%', left: '80%', width: '20px', height: '20px' },// Initial position and size
            { top: '90%', left: '150%', width: '30px', height: '30px' },
            { top: '105%', left: '235%', width: '60px', height: '60px' },
            { top: '120%', left: '322%', width: '90px', height: '90px' },
            { top: '105%', left: '408%', width: '120px', height: '120px' },
            { top: '90%', left: '500%', width: '180px', height: '180px' },
            { top: `${finalTop}%`, left: `${finalLeft}%`, width: `${endSize}px`, height: `${endSize}px` },
            { top: `${finalTop}%`, left: `${finalLeft}%`, width: `${endSize+100}px`, height: `${endSize+100}px` } // Final position and size
        ],
        {
            duration: duration,
            easing: 'ease-out',
            fill: 'forwards'
        }
    );
     // Create and append the speech bubble
     const speechBubble = document.getElementById('speechBubble');
     speechBubble.textContent = 'Welcome to Planner Studio';

     // Position the speech bubble relative to the fluffball
     const fluffballRect = fluffball.getBoundingClientRect();

    // Replace with exploding gif after the animation
    setTimeout(() => {
        fluffball.style.backgroundImage = 'url("/static/gifs/110.gif")';
        fluffball.style.backgroundPosition = 'center center';
        fluffball.style.backgroundSize = '350% 220%';
        setTimeout(() => {
        speechBubble.style.display='';
        document.getElementById('fluffball').appendChild(speechBubble);
        },600);
    }, duration);

    setTimeout(() => {
        fluffball.style.backgroundImage = 'url("/static/gifs/111.gif")';
        fluffball.style.backgroundPosition = 'center center';
        fluffball.style.backgroundSize = 'cover';
        speechBubble.textContent = 'This app will help you to mange your life';
    }, duration+1800);
    setTimeout(() => {
        document.getElementById('creat_tables').classList.add('highlight_Element');
        fluffball.style.backgroundImage = 'url("/static/gifs/112.gif")';
        fluffball.style.backgroundPosition = 'center center';
        fluffball.style.backgroundSize = '400% 230%';
        speechBubble.textContent = "Now let's get started and creat a new table";
    }, duration+4000);


    setTimeout(() => {
        fluffball.style.backgroundImage = '';
        speechBubble.style.display = 'none';
        fluffball.animate(
            [
                { top: `${finalTop}%`, left: `${finalLeft}%`, width: `${endSize+100}px`, height: `${endSize+100}px` },
                { top: `${finalTop}%`, left: `${finalLeft}%`, width: `${endSize}px`, height: `${endSize}px` },
                { top: '120%', left: '20%', width: '80px', height: '80px' },

            ],
            {
                duration: duration/2,
                easing: 'ease-out',
                fill: 'forwards'
            }
        );

    }, duration+6000);

    setTimeout(() => {
        fluffball.style.display = 'none';
        document.getElementById('gifContainer').style.display='';
        document.getElementById('kitty-gifs').src = "/static/gifs/111.gif" ;
    }, duration+8000);

};

function test(){
    console.log('test')
    var element = document.getElementById('title');
    while (element && element.id !== 'title') {
        element.style.display = '';
        element = element.parentElement;
    };
}