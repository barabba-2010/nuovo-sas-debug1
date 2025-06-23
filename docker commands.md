# 1.	Attività eseguite
------------------------------------------------------------------------------
1. Installato docker desktop da https://www.docker.com/products/docker-desktop/
	Avviare docker

	## 3.1.	Comandi Utili dell'istallazione
	---------------------------------------
	**Azione**							**Comando**
	versione di docker					*docker --version*
	versione compose					*docker-compose --version*
	verifica corretta installazione		*docker run hello-world*

	Controlla container attivi			*docker ps*
	Vedi anche quelli fermati			*docker ps -a*
	Rimuovi uno specifico				*docker rm <ID o nome>*
	Rimuovi tutti i fermati				*docker container prune*
	
	Eseguire un container temp			*docker run -it --rm -v ${PWD}:/app -w /app node:20-alpine sh*
	
	eseguire la build					*docker-compose up --build* (--no-cache) (> log.log 2>&1) 
		in alternativa 					*docker-compose build --no-cache* seguito da *docker-compose up*

