---
titre: Registre des activités de traitement — Alt.
version: 0.1 (brouillon)
statut: BROUILLON — document interne, à relire par un juriste
derniere_mise_a_jour: "[À COMPLÉTER : date]"
---

# Registre des activités de traitement (article 30 du RGPD)

> **Document interne.** Ce registre décrit les traitements de données personnelles réalisés par Alt. Il doit être tenu à jour à chaque évolution de l'application. Les durées sont des **propositions** cohérentes avec la [politique de confidentialité](../../content/legal/confidentialite.md).

## Responsable du traitement

| Champ | Valeur |
|---|---|
| Nom / raison sociale | [À COMPLÉTER : nom de l'éditeur] |
| Adresse | [À COMPLÉTER : adresse postale] |
| SIREN / RNA | [À COMPLÉTER : numéro] |
| Représentant légal | [À COMPLÉTER : nom et fonction] |
| Contact données personnelles | [À COMPLÉTER : adresse e-mail] |
| DPO | [À COMPLÉTER : nom et coordonnées, ou « non désigné » après analyse de l'obligation] |

## Mesures de sécurité communes à tous les traitements

Pour éviter les répétitions, les mesures suivantes s'appliquent à tous les traitements ci-dessous (« **Socle** ») :

- Hébergement Supabase, région Union européenne ; chiffrement des échanges (TLS) et des données au repos [À COMPLÉTER : confirmer le chiffrement au repos auprès de Supabase].
- Politiques de sécurité au niveau des lignes (Row Level Security) : chaque membre n'accède qu'à ses propres données privées.
- Clés d'administration jamais embarquées dans l'application mobile.
- Back-office de modération : accès nominatif, réservé à l'équipe, authentification forte [À COMPLÉTER : confirmer la double authentification], journalisation des actions.
- Sauvegardes régulières [À COMPLÉTER : fréquence et durée de rétention des sauvegardes].
- Contrats de sous-traitance (article 28) signés avec chaque prestataire.
- Procédure de gestion des violations de données (notification CNIL sous 72 h).

---

## T1 — Gestion des comptes et authentification

| Champ | Contenu |
|---|---|
| **Finalité** | Créer et gérer le compte d'un membre, l'authentifier via Apple ou Google. |
| **Personnes concernées** | Membres inscrits. |
| **Catégories de données** | Nom, adresse e-mail (éventuellement adresse relais Apple), identifiant fournisseur (Apple / Google), identifiant interne, dates de création et de dernière connexion. |
| **Base légale** | Exécution du contrat (conditions d'utilisation). |
| **Durée de conservation** | Durée de vie du compte. Suppression après 24 mois d'inactivité, après relance (préavis de 30 jours). |
| **Destinataires** | Équipe Alt. (support, modération), dans la limite de leurs besoins. |
| **Sous-traitants** | Supabase (authentification, base de données). Apple et Google interviennent comme responsables de traitement indépendants pour la connexion. |
| **Transferts hors UE** | Possibles via la société mère de Supabase (États-Unis) — [À COMPLÉTER : garanties (DPF / clauses contractuelles types)]. |
| **Mesures de sécurité** | Socle ; aucun mot de passe stocké par Alt. (connexion déléguée). |

## T2 — Profil du membre

| Champ | Contenu |
|---|---|
| **Finalité** | Personnaliser les recommandations d'alternatives et l'affichage. |
| **Personnes concernées** | Membres inscrits. |
| **Catégories de données** | Nom affiché, ville, quartier, domaines d'intérêt, contrainte principale (ex. budget, temps, mobilité). |
| **Base légale** | Exécution du contrat. |
| **Durée de conservation** | Durée de vie du compte. |
| **Destinataires** | Le membre ; nom affiché et quartier visibles par les autres membres dans l'entraide ; équipe Alt. |
| **Sous-traitants** | Supabase. |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle ; champs facultatifs ; la « contrainte principale » est formulée en catégories générales pour ne pas révéler de donnée sensible (santé, situation financière précise). |

## T3 — Géolocalisation

| Champ | Contenu |
|---|---|
| **Finalité** | Afficher les lieux et alternatives à proximité. |
| **Personnes concernées** | Utilisateurs, avec ou sans compte, ayant accordé la permission. |
| **Catégories de données** | Position (approximative acceptée) ou adresse / quartier saisi manuellement. |
| **Base légale** | Consentement (permission système explicite, retirable). |
| **Durée de conservation** | Proposition : utilisation en temps réel, **pas de conservation côté serveur** [À COMPLÉTER : confirmer l'implémentation technique]. |
| **Destinataires** | Aucun (traitement à la volée). |
| **Sous-traitants** | Supabase (requête de recherche) ; [À COMPLÉTER : fournisseur de fonds de carte, qui reçoit l'adresse IP et la zone affichée]. |
| **Transferts hors UE** | [À COMPLÉTER : selon le fournisseur de fonds de carte]. |
| **Mesures de sécurité** | Socle ; demande de précision approximative par défaut ; aucune journalisation des coordonnées. |

## T4 — Contributions (lieux, corrections, signalements d'erreurs, photos)

| Champ | Contenu |
|---|---|
| **Finalité** | Enrichir et fiabiliser la base collaborative de lieux. |
| **Personnes concernées** | Membres contributeurs ; personnes éventuellement visibles sur les photos. |
| **Catégories de données** | Contenu de la contribution, photo facultative (avec métadonnées), identifiant de l'auteur, date, statut de validation. |
| **Base légale** | Exécution du contrat. |
| **Durée de conservation** | Contributions publiées : conservées et **anonymisées** à la suppression du compte. Contributions refusées : 12 mois. Photos : [À COMPLÉTER : conservation anonymisée ou suppression à la suppression du compte]. |
| **Destinataires** | Public (contenu publié) ; équipe de modération. |
| **Sous-traitants** | Supabase (base de données, stockage des fichiers). |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle ; **suppression des métadonnées EXIF (dont position GPS) des photos avant stockage** [À COMPLÉTER : confirmer l'implémentation] ; modération des photos ; consigne de ne pas photographier de personnes. |

## T5 — Parcours d'actions et calcul d'impact

| Champ | Contenu |
|---|---|
| **Finalité** | Accompagner le membre dans ses actions et lui montrer leur impact estimé. |
| **Personnes concernées** | Membres inscrits. |
| **Catégories de données** | Actions choisies et réalisées, dates, impact estimé calculé. |
| **Base légale** | Exécution du contrat. |
| **Durée de conservation** | Durée de vie du compte. |
| **Destinataires** | Le membre uniquement (jamais affiché aux autres, aucun classement). Statistiques agrégées anonymes pour l'équipe. |
| **Sous-traitants** | Supabase. |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle ; pas de décision automatisée produisant des effets juridiques. |

## T6 — Entraide : annonces et acceptation des règles

| Champ | Contenu |
|---|---|
| **Finalité** | Permettre aux membres de proposer ou demander des services gratuits dans leur quartier. |
| **Personnes concernées** | Membres publiant ou consultant des annonces. |
| **Catégories de données** | Annonce (type, texte, catégorie, photo facultative), quartier, nom affiché, version et date d'acceptation des règles de l'entraide. |
| **Base légale** | Exécution du contrat. |
| **Durée de conservation** | Annonce : jusqu'à clôture puis 3 mois d'archivage ; supprimée avec le compte. Preuve d'acceptation des règles : durée du compte. |
| **Destinataires** | Membres (annonce) ; équipe de modération. |
| **Sous-traitants** | Supabase. |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle ; **adresse exacte jamais collectée ni publiée** (quartier uniquement) ; aucune monétisation ; aucun classement des membres. |

## T7 — Entraide : messagerie, blocages et remerciements

| Champ | Contenu |
|---|---|
| **Finalité** | Permettre aux membres d'organiser un service ; protéger les membres des comportements indésirables. |
| **Personnes concernées** | Membres participant à une conversation ; membres bloqués. |
| **Catégories de données** | Messages, horodatage, participants, liste des blocages, remerciements privés. |
| **Base légale** | Exécution du contrat. |
| **Durée de conservation** | Durée de vie du compte ; **messages effacés à la suppression du compte**. [À COMPLÉTER : durée maximale pour les conversations inactives, ex. 24 mois] |
| **Destinataires** | Participants à la conversation uniquement. Équipe de modération **seulement pour un message signalé** [À COMPLÉTER : confirmer le mécanisme technique]. |
| **Sous-traitants** | Supabase. |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle ; politiques d'accès limitant la lecture aux participants ; blocage invisible pour la personne bloquée. |

## T8 — Modération, signalements et retrait des contenus

| Champ | Contenu |
|---|---|
| **Finalité** | Traiter les signalements, retirer les contenus illicites ou contraires aux règles, gérer les contestations. |
| **Personnes concernées** | Auteurs des signalements, auteurs des contenus signalés, personnes mentionnées. |
| **Catégories de données** | Contenu signalé (ou copie), motif, auteur du signalement, décision et motivation, sanctions, contestations, données de connexion utiles. |
| **Base légale** | Obligation légale (LCEN, DSA) ; intérêt légitime (sécurité de la communauté). |
| **Durée de conservation** | 12 mois après clôture du dossier. [À COMPLÉTER : sort d'une copie de message signalé après suppression du compte de l'auteur] |
| **Destinataires** | Équipe de modération ; autorités sur réquisition. |
| **Sous-traitants** | Supabase (back-office). |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle ; accès back-office restreint et tracé ; confidentialité de l'identité de la personne qui signale. |

## T9 — Données de connexion (obligation de conservation)

| Champ | Contenu |
|---|---|
| **Finalité** | Répondre aux obligations légales de conservation des données permettant d'identifier l'auteur d'un contenu publié. |
| **Personnes concernées** | Membres publiant des contenus. |
| **Catégories de données** | Identifiant, adresse IP, date et heure de connexion et de publication. |
| **Base légale** | Obligation légale [À COMPLÉTER : texte applicable à confirmer par le juriste]. |
| **Durée de conservation** | 12 mois [À COMPLÉTER : à confirmer]. |
| **Destinataires** | Autorités judiciaires sur réquisition uniquement. |
| **Sous-traitants** | Supabase. |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle ; accès strictement limité. |

## T10 — Favoris

| Champ | Contenu |
|---|---|
| **Finalité** | Permettre au membre d'enregistrer des lieux et actions. |
| **Personnes concernées** | Membres inscrits. |
| **Catégories de données** | Liste des lieux et actions enregistrés, dates. |
| **Base légale** | Exécution du contrat. |
| **Durée de conservation** | Durée de vie du compte. |
| **Destinataires** | Le membre uniquement. |
| **Sous-traitants** | Supabase. |
| **Transferts hors UE** | Idem T1. |
| **Mesures de sécurité** | Socle. |

## T11 — Notifications push

| Champ | Contenu |
|---|---|
| **Finalité** | Envoyer des notifications utiles (réponse à un message, suivi d'une contribution, rappels du parcours selon préférences). |
| **Personnes concernées** | Membres ayant accepté les notifications. |
| **Catégories de données** | Jeton de notification de l'appareil, préférences de notification. |
| **Base légale** | Consentement (permission système, retirable). |
| **Durée de conservation** | Jusqu'à désactivation, déconnexion ou invalidation du jeton (purge automatique des jetons invalides). |
| **Destinataires** | Aucun (usage technique). |
| **Sous-traitants** | Supabase ; [À COMPLÉTER : service d'acheminement — Expo, Firebase Cloud Messaging, Apple Push Notification service]. |
| **Transferts hors UE** | [À COMPLÉTER : selon le service d'acheminement]. |
| **Mesures de sécurité** | Socle ; contenu des notifications sans donnée sensible (pas d'extrait de message privé sur l'écran verrouillé par défaut). |

## T12 — Mesure d'audience interne

| Champ | Contenu |
|---|---|
| **Finalité** | Comprendre l'usage de l'application pour l'améliorer (statistiques de fréquentation et d'usage des fonctionnalités). |
| **Personnes concernées** | Utilisateurs n'ayant pas refusé la mesure. |
| **Catégories de données** | Identifiant pseudonyme, événements d'usage (écrans, fonctionnalités), version de l'app, type d'appareil. |
| **Base légale** | Intérêt légitime avec droit d'opposition, sous réserve du respect des conditions d'exemption de consentement de la CNIL [À COMPLÉTER : validation juridique ; à défaut, consentement préalable]. |
| **Durée de conservation** | Identifiant : 13 mois ; données brutes : 13 mois ; statistiques agrégées : 25 mois. |
| **Destinataires** | Équipe Alt. (statistiques agrégées uniquement). |
| **Sous-traitants** | [À COMPLÉTER : outil retenu ; Supabase si mesure en interne]. |
| **Transferts hors UE** | [À COMPLÉTER]. |
| **Mesures de sécurité** | Socle ; pseudonymisation ; aucun croisement avec d'autres traitements ni avec des données tierces ; aucun suivi entre applications ; refus possible dans les réglages. |

## T13 — Rapports de plantage

| Champ | Contenu |
|---|---|
| **Finalité** | Détecter et corriger les erreurs techniques. |
| **Personnes concernées** | Utilisateurs de l'application (données non identifiantes visées). |
| **Catégories de données** | Trace technique de l'erreur, modèle d'appareil, version de l'OS et de l'app. **Aucune donnée personnelle** (envoi de l'IP, des identifiants et du contenu utilisateur désactivé). |
| **Base légale** | Intérêt légitime. |
| **Durée de conservation** | 90 jours. |
| **Destinataires** | Équipe technique. |
| **Sous-traitants** | Sentry, région UE. |
| **Transferts hors UE** | Possibles via la société mère de Sentry (États-Unis) — [À COMPLÉTER : garanties]. |
| **Mesures de sécurité** | Socle ; option « envoi de données personnelles » désactivée ; filtrage des données avant envoi [À COMPLÉTER : confirmer la configuration]. |

## T14 — Exercice des droits et support

| Champ | Contenu |
|---|---|
| **Finalité** | Répondre aux demandes des personnes (accès, export, suppression, opposition…) et au support. |
| **Personnes concernées** | Membres et toute personne nous contactant. |
| **Catégories de données** | Identité, coordonnées, contenu de la demande, réponse apportée. |
| **Base légale** | Obligation légale (articles 12 à 22 du RGPD) ; intérêt légitime pour le support. |
| **Durée de conservation** | Durée de traitement de la demande, puis 5 ans pour la preuve [À COMPLÉTER : à valider]. |
| **Destinataires** | Équipe Alt. |
| **Sous-traitants** | [À COMPLÉTER : messagerie électronique utilisée par l'équipe]. |
| **Transferts hors UE** | [À COMPLÉTER : selon le service de messagerie]. |
| **Mesures de sécurité** | Socle ; export automatisé en JSON depuis l'application ; suppression automatisée du compte (anonymisation des lieux publiés, effacement des messages). |

---

## Note de minimisation

Alt. applique le principe de **minimisation** (article 5.1.c du RGPD) : ne collecter que ce qui est strictement nécessaire. Choix de conception retenus :

1. **Usage sans compte.** La carte et les fiches sont accessibles sans inscription. Le compte n'est demandé que pour contribuer, suivre un parcours, utiliser l'entraide ou enregistrer des favoris.
2. **Connexion déléguée minimale.** Seuls le nom et l'e-mail sont demandés à Apple / Google (aucune photo de profil, aucun contact, aucune date de naissance). Pas de mot de passe stocké. L'adresse relais d'Apple est acceptée.
3. **Géolocalisation sobre.** Consentement explicite, précision approximative suffisante, alternative par saisie manuelle, pas de conservation de l'historique des positions.
4. **Quartier plutôt qu'adresse.** Le profil et les annonces d'entraide ne demandent jamais d'adresse exacte.
5. **Profil facultatif et en catégories.** Domaines d'intérêt et contrainte principale sous forme de listes fermées, pour éviter la saisie libre de données sensibles.
6. **Photos nettoyées.** Photos facultatives ; métadonnées EXIF (dont GPS) supprimées ; consigne de ne pas photographier de personnes.
7. **Pas de classement, pas de score social.** L'impact n'est visible que par le membre lui-même ; l'entraide ne comporte ni note ni palmarès.
8. **Mesure d'audience pseudonymisée et refusable**, sans croisement ni outil publicitaire.
9. **Rapports de plantage sans données personnelles**, hébergés dans l'UE, conservés 90 jours.
10. **Suppression effective.** Effacement du compte depuis l'application ; les seules données conservées (lieux publiés) sont anonymisées car utiles à la communauté.
11. **Aucune exploitation commerciale.** Pas de vente de données ; une éventuelle mise en avant payante future serait séparée des recommandations et ne donnerait lieu à aucun partage de données personnelles.

### Points à arbitrer

- [À COMPLÉTER : nécessité ou non d'une analyse d'impact (AIPD) — la messagerie et l'usage de la géolocalisation sont à examiner au regard de la liste CNIL des traitements soumis à AIPD]
- [À COMPLÉTER : âge minimum d'inscription et mesures spécifiques pour les mineurs]
- [À COMPLÉTER : sort des photos et des copies de messages signalés à la suppression du compte]
