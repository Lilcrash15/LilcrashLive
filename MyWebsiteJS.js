function copyText(){
    
    /*Get the text field*/
    var copyText = document.getElementById("myInput");
    
    /*Select the text field*/
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/
    
    /* Copy the text inside the text field */
    document.execCommand("copy");
    
    /* Alert the copied text */
    alert("Copied ✔ " + copyText.value);
}

function redirect(){
    alert("You will be redirected to Twitch.tv to complete your purchase.")    
}
