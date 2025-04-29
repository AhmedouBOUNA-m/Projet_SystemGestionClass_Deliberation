document.addEventListener("DOMContentLoaded", () =>{
    //initialisation de la base donnée simulé
    let user = JSON.parse(localStorage.getItem("users"))||[];
    //Gestion d'inscription
    document.getElementById("formInscrip").addEventListener("submit",function(e){
        e.preventDefault();
        //recuperation des champs
        const userName = document.getElementById("userName").value;
        const email = document.getElementById("mail").value;
        const motDePasse = document.getElementById("mdp").value;
        // console.log(userName, email, motDePasse);
        const newUser = {userName,email,motDePasse}
        user.push(newUser)
        localStorage.setItem("User", JSON.stringify(user));
        // alert("Inscruption Reussite")
    })

    // connexion
    
    document.getElementById("formconnexion").addEventListener("submit",function (e){
        e.preventDefault();
        const email = document.getElementById("Email").value;
        const motDePasse = document.getElementById("psw").value;

        const userFund = user.find((u) => u.email === email && u.motDePasse === motDePasse);
        if (userFund) {
            alert("connexion reussite");
            // window.location.herf = "index.html";
        }else{
            
            alert("Email ou mot de passe incorrect");
        }
    })
})
