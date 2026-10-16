package com.finovex.entity;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.finovex.enums.MasterDataStatus;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/**
 * A party the business deals with: a customer, a vendor, or both. The stakeholder code is unique
 * within the business; the parts it plays are its {@link StakeholderStakeholderType} rows.
 */
@Entity
@Table(name = "stakeholder")
@EntityListeners(AuditingEntityListener.class)
public class Stakeholder {
    private Integer stakeholderSeq;
    private Integer businessSeq;
    private String stakeholderCode;
    private String stakeholderName;
    private String phone;
    private String email;
    private String address;
    private String taxNo;
    private Integer status;
    private String statusDescription;
    private String createdBy;
    private Date createdDate;
    private String lastModifiedBy;
    private Date lastModifiedDate;

    private Business business;
    private List<StakeholderStakeholderType> stakeholderStakeholderTypes = new ArrayList<>();


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "G1")
    @SequenceGenerator(name = "G1", sequenceName = "stakeholder_seq", allocationSize = 1)
    @Column(name = "stakeholder_seq", unique = true)
    public Integer getStakeholderSeq() {
        return stakeholderSeq;
    }

    public void setStakeholderSeq(Integer stakeholderSeq) {
        this.stakeholderSeq = stakeholderSeq;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_seq", nullable = false)
    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    @Basic
    @Column(name = "business_seq", insertable = false, updatable = false, nullable = false)
    public Integer getBusinessSeq() {
        return businessSeq;
    }

    public void setBusinessSeq(Integer businessSeq) {
        this.businessSeq = businessSeq;
    }

    @Basic
    @Column(name = "stakeholder_code", length = 30, nullable = false)
    public String getStakeholderCode() {
        return stakeholderCode;
    }

    public void setStakeholderCode(String stakeholderCode) {
        this.stakeholderCode = stakeholderCode;
    }

    @Basic
    @Column(name = "stakeholder_name", length = 120, nullable = false)
    public String getStakeholderName() {
        return stakeholderName;
    }

    public void setStakeholderName(String stakeholderName) {
        this.stakeholderName = stakeholderName;
    }

    @Basic
    @Column(name = "phone", length = 30)
    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    @Basic
    @Column(name = "email", length = 120)
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Basic
    @Column(name = "address", length = 500)
    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    /** VAT or business registration number. */
    @Basic
    @Column(name = "tax_no", length = 50)
    public String getTaxNo() {
        return taxNo;
    }

    public void setTaxNo(String taxNo) {
        this.taxNo = taxNo;
    }

    /** Its stakeholder types, deleted links included. Saved together with the stakeholder. */
    @OneToMany(mappedBy = "stakeholder", cascade = CascadeType.ALL)
    public List<StakeholderStakeholderType> getStakeholderStakeholderTypes() {
        return stakeholderStakeholderTypes;
    }

    public void setStakeholderStakeholderTypes(List<StakeholderStakeholderType> stakeholderStakeholderTypes) {
        this.stakeholderStakeholderTypes = stakeholderStakeholderTypes;
    }

    /** Gives this stakeholder a type: an approved link, saved along with the stakeholder. */
    public void addStakeholderType(StakeholderType stakeholderType) {
        StakeholderStakeholderType link = new StakeholderStakeholderType();
        link.setStakeholder(this);
        link.setStakeholderType(stakeholderType);
        link.setStatus(MasterDataStatus.APPROVED.getStatusSeq());
        this.stakeholderStakeholderTypes.add(link);
    }

    @Basic
    @Column(name = "status", nullable = true)
    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
        if (status != null) {
            this.setStatusDescription(MasterDataStatus.findOne(status).getStatus());
        }
    }

    @Basic
    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    @Basic
    @CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    @Basic
    @LastModifiedBy
    @Column(name = "last_modified_by")
    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    @Basic
    @LastModifiedDate
    @Column(name = "last_modified_date", nullable = true)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    public Date getLastModifiedDate() {
        return lastModifiedDate;
    }

    public void setLastModifiedDate(Date lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }

    @Transient
    public String getStatusDescription() {
        return statusDescription;
    }

    public void setStatusDescription(String statusDescription) {
        this.statusDescription = statusDescription;
    }
}
