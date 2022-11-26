let articleDiv;
let text = '';

function initArticleDiv(div){
    articleDiv = div;
    extractText(articleDiv);
    console.log("number of paragraphs = " + articleDiv.children.length)
}

function extractText(element){
    console.log(element.innerHTML   )

    if(element.children.length == 0){
        text += element.innerHTML;
        return;
    }
    for(const child of element.children){
        extractText(child);
    }
}

function toggle(){

    // assumes the readBtn, on click reads the passage
    btn = document.getElementById('readBtn')
    if(window.speechSynthesis.speaking){
        window.speechSynthesis.cancel();
        btn.innerHTML = 'Read out loud'
    }
    else{
        console.log(text)
        var msg = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(msg);
        btn.innerHTML = 'Cancel'
    }        
}

function stop(){
    window.speechSynthesis.cancel();
}

window.onbeforeunload = function(){
    stop();
};