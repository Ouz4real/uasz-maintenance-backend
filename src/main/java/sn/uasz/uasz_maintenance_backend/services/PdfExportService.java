package sn.uasz.uasz_maintenance_backend.services;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.entities.Panne;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfExportService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] exportPanneToPdf(Panne p) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        Document doc = new Document(PageSize.A4, 40, 40, 60, 40);
        PdfWriter.getInstance(doc, out);
        doc.open();

        // ---- Fonts ----
        Font titleFont  = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(30, 64, 175));
        Font headFont   = new Font(Font.HELVETICA, 11, Font.BOLD, Color.WHITE);
        Font labelFont  = new Font(Font.HELVETICA, 10, Font.BOLD, new Color(55, 65, 81));
        Font valueFont  = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(31, 41, 55));
        Font smallGray  = new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(107, 114, 128));

        // ---- Header band ----
        PdfPTable header = new PdfPTable(1);
        header.setWidthPercentage(100);
        PdfPCell hCell = new PdfPCell(new Phrase("RAPPORT DE DEMANDE DE MAINTENANCE", titleFont));
        hCell.setBackgroundColor(new Color(239, 246, 255));
        hCell.setBorderColor(new Color(30, 64, 175));
        hCell.setBorderWidth(1.5f);
        hCell.setPadding(14);
        hCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        header.addCell(hCell);
        doc.add(header);
        doc.add(Chunk.NEWLINE);

        // ---- Section helper ----
        // Informations générales
        doc.add(sectionTitle("Informations générales", headFont));
        PdfPTable infoTable = twoColTable();
        addRow(infoTable, "Référence", "#" + p.getId(), labelFont, valueFont);
        addRow(infoTable, "Titre", p.getTitre(), labelFont, valueFont);
        addRow(infoTable, "Date de signalement",
                p.getDateSignalement() != null ? p.getDateSignalement().format(FMT) : "-",
                labelFont, valueFont);
        addRow(infoTable, "Signalée par", nvl(p.getSignaleePar()), labelFont, valueFont);
        addRow(infoTable, "Lieu", nvl(p.getLieu()), labelFont, valueFont);
        addRow(infoTable, "Type d'équipement",
                p.getEquipement() != null ? p.getEquipement().getLibelle() : nvl(p.getTypeEquipement()),
                labelFont, valueFont);
        doc.add(infoTable);
        doc.add(Chunk.NEWLINE);

        // Statut & priorité
        doc.add(sectionTitle("Statut & Priorité", headFont));
        PdfPTable statusTable = twoColTable();
        addRow(statusTable, "Statut", formatStatut(p.getStatut() != null ? p.getStatut().name() : "-"), labelFont, valueFont);
        addRow(statusTable, "Priorité demandeur", formatPriorite(p.getPriorite() != null ? p.getPriorite().name() : "-"), labelFont, valueFont);
        if (p.getPrioriteResponsable() != null) {
            addRow(statusTable, "Priorité responsable", formatPriorite(p.getPrioriteResponsable().name()), labelFont, valueFont);
        }
        addRow(statusTable, "Statut intervention",
                p.getStatutInterventions() != null ? formatStatutIntervention(p.getStatutInterventions().name()) : "-",
                labelFont, valueFont);
        doc.add(statusTable);
        doc.add(Chunk.NEWLINE);

        // Description
        doc.add(sectionTitle("Description", headFont));
        PdfPTable descTable = new PdfPTable(1);
        descTable.setWidthPercentage(100);
        PdfPCell descCell = new PdfPCell(new Phrase(nvl(p.getDescription()), valueFont));
        descCell.setPadding(8);
        descCell.setBorderColor(new Color(209, 213, 219));
        descTable.addCell(descCell);
        doc.add(descTable);
        doc.add(Chunk.NEWLINE);

        // Technicien
        if (p.getTechnicien() != null) {
            doc.add(sectionTitle("Technicien assigné", headFont));
            PdfPTable techTable = twoColTable();
            String techNom = (p.getTechnicien().getPrenom() != null ? p.getTechnicien().getPrenom() : "")
                    + " " + (p.getTechnicien().getNom() != null ? p.getTechnicien().getNom() : "");
            addRow(techTable, "Nom", techNom.trim(), labelFont, valueFont);
            if (p.getDateDebutIntervention() != null) {
                addRow(techTable, "Début intervention", p.getDateDebutIntervention().format(FMT), labelFont, valueFont);
            }
            if (p.getDateFinIntervention() != null) {
                addRow(techTable, "Fin intervention", p.getDateFinIntervention().format(FMT), labelFont, valueFont);
            }
            doc.add(techTable);
            doc.add(Chunk.NEWLINE);
        }

        // Note technicien
        if (p.getNoteTechnicien() != null && !p.getNoteTechnicien().isBlank()) {
            doc.add(sectionTitle("Note du technicien", headFont));
            PdfPTable noteTable = new PdfPTable(1);
            noteTable.setWidthPercentage(100);
            PdfPCell noteCell = new PdfPCell(new Phrase(p.getNoteTechnicien(), valueFont));
            noteCell.setPadding(8);
            noteCell.setBorderColor(new Color(209, 213, 219));
            noteTable.addCell(noteCell);
            doc.add(noteTable);
            doc.add(Chunk.NEWLINE);
        }

        // Pièces utilisées
        if (p.getPiecesUtilisees() != null && !p.getPiecesUtilisees().isBlank()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode pieces = mapper.readTree(p.getPiecesUtilisees());
                if (pieces.isArray() && pieces.size() > 0) {
                    doc.add(sectionTitle("Pièces utilisées", headFont));
                    Font colHead = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
                    PdfPTable piecesTable = new PdfPTable(new float[]{70f, 30f});
                    piecesTable.setWidthPercentage(100);
                    // En-têtes
                    PdfPCell h1 = new PdfPCell(new Phrase("Nom de la pièce", colHead));
                    h1.setBackgroundColor(new Color(59, 130, 246));
                    h1.setPadding(6);
                    h1.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                    piecesTable.addCell(h1);
                    PdfPCell h2 = new PdfPCell(new Phrase("Quantité", colHead));
                    h2.setBackgroundColor(new Color(59, 130, 246));
                    h2.setPadding(6);
                    h2.setHorizontalAlignment(Element.ALIGN_CENTER);
                    h2.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                    piecesTable.addCell(h2);
                    // Lignes
                    int i = 0;
                    for (com.fasterxml.jackson.databind.JsonNode piece : pieces) {
                        String nom = piece.path("nom").asText("-");
                        String qte = piece.path("quantite").asText("0");
                        Color rowBg = (i % 2 == 0) ? new Color(243, 244, 246) : Color.WHITE;
                        PdfPCell nc = new PdfPCell(new Phrase(nom, valueFont));
                        nc.setBackgroundColor(rowBg);
                        nc.setPadding(6);
                        nc.setBorderColor(new Color(209, 213, 219));
                        piecesTable.addCell(nc);
                        PdfPCell qc = new PdfPCell(new Phrase(qte, valueFont));
                        qc.setBackgroundColor(rowBg);
                        qc.setPadding(6);
                        qc.setHorizontalAlignment(Element.ALIGN_CENTER);
                        qc.setBorderColor(new Color(209, 213, 219));
                        piecesTable.addCell(qc);
                        i++;
                    }
                    doc.add(piecesTable);
                    doc.add(Chunk.NEWLINE);
                }
            } catch (Exception ignored) {}
        }

        // Commentaire interne
        if (p.getCommentaireInterne() != null && !p.getCommentaireInterne().isBlank()) {
            doc.add(sectionTitle("Commentaire responsable", headFont));
            PdfPTable commTable = new PdfPTable(1);
            commTable.setWidthPercentage(100);
            PdfPCell commCell = new PdfPCell(new Phrase(p.getCommentaireInterne(), valueFont));
            commCell.setPadding(8);
            commCell.setBorderColor(new Color(209, 213, 219));
            commTable.addCell(commCell);
            doc.add(commTable);
            doc.add(Chunk.NEWLINE);
        }

        // Footer
        doc.add(Chunk.NEWLINE);
        Paragraph footer = new Paragraph("Document généré automatiquement par la plateforme UASZ Maintenance", smallGray);
        footer.setAlignment(Element.ALIGN_CENTER);
        doc.add(footer);

        doc.close();
        return out.toByteArray();
    }

    // ---- Helpers ----

    private PdfPTable sectionTitle(String text, Font font) throws DocumentException {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBackgroundColor(new Color(30, 64, 175));
        c.setPadding(6);
        c.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        t.addCell(c);
        return t;
    }

    private PdfPTable twoColTable() throws DocumentException {
        PdfPTable t = new PdfPTable(new float[]{35f, 65f});
        t.setWidthPercentage(100);
        return t;
    }

    private void addRow(PdfPTable t, String label, String value, Font lf, Font vf) {
        PdfPCell lc = new PdfPCell(new Phrase(label, lf));
        lc.setBackgroundColor(new Color(243, 244, 246));
        lc.setPadding(6);
        lc.setBorderColor(new Color(209, 213, 219));
        t.addCell(lc);

        PdfPCell vc = new PdfPCell(new Phrase(value, vf));
        vc.setPadding(6);
        vc.setBorderColor(new Color(209, 213, 219));
        t.addCell(vc);
    }

    private String nvl(String s) { return s != null ? s : "-"; }

    private String formatStatut(String s) {
        return switch (s) {
            case "OUVERTE" -> "En attente";
            case "EN_COURS" -> "En cours";
            case "RESOLUE" -> "Résolue";
            default -> s;
        };
    }

    private String formatPriorite(String p) {
        return switch (p) {
            case "BASSE" -> "Basse";
            case "MOYENNE" -> "Moyenne";
            case "HAUTE" -> "Haute";
            default -> p;
        };
    }

    private String formatStatutIntervention(String s) {
        return switch (s) {
            case "NON_DEMARREE" -> "Non démarrée";
            case "EN_COURS" -> "En cours";
            case "TERMINEE" -> "Terminée";
            case "ANNULEE" -> "Annulée";
            default -> s;
        };
    }
}
