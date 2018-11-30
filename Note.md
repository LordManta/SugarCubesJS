Un instant SugarCubes v5 est décomposé en une succession de phases temporelles qui ne se chevauchent pas (synchronisation éventuelle par barrières temporelles) :

- acquisition des entrées (sensors, events, programs)
- exécution réactive proprement dite elle même décomposée en 2 phases :
  * `activate()` : activation cyclique jusqu'au point fixe
  * `eoi()` : propagation de l'information de fin d'instant
- collection des valeurs des occurrences d'événements valués (construits des listes de valeurs émises de façon déterministe)
- Exécution des actions atomiques et des actions de sortie
- Écrasement de l'ancien état du système par le nouvel état.

En SugarCubesJS, il y a 2 types de signaux :
- les sensors : qui sont des entrées pures du système, c'est-à-dire que leur présence ou leur absence est déterminé au tout début d'un instant et ils ne peuvent pas être générés par un programme réactif. On les appels aussi « événements système ». Ils ne peuvent être générés que par l'environnement extérieur et leur valeur est déterminée par la machine d'exécution au cours de la phase d'acquisition des entrées.
- les événements : qui peuvent être générés par l'environnement ou le programme lui même. Leur valeur n'est garantie d'être connue qu'à la toute fin de la phase d'exécution réactive. De ce fait, on dit qu'il est impossible de réagir instantanément à l'absence d'événements en SugarCubesJS. C'est le réactif « à la Boussinot ».

Un programme réactif peut exécuter des fonction ou des clôtures javascript. Cependant, il appartient au développeur du programme d'assurer quelques propriétés concernant ces codes javascript. Les programmes doivent terminer et ce dans un temps suffisamment court pour garantir les propriétés de réactivité du système. Les programmes doivent également ne pas produire d'effets de bord afin de ne pas interférer avec l'exécution réactive.
